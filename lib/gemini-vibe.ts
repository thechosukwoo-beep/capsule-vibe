import { GoogleGenAI } from "@google/genai";
import type { CapsuleWeather } from "@/lib/capsule-weather";
import {
  CAPSULE_SHAPES,
  fallbackVibe,
  normalizeVibe,
  type CapsuleVibe,
} from "@/lib/capsule-vibe";

const MODEL = "gemini-3.7-flash";
const VIBE_TIMEOUT_MS = 20000;

const vibeSchema = {
  type: "object",
  properties: {
    quote: {
      type: "string",
      description: "날씨에서 영감을 받은 한국어 한마디. 한 문장, 32자 이내. 편지 내용 금지.",
    },
    keywords: {
      type: "array",
      description: "봉인 중에도 내용을 떠올리게 하는 짧은 한국어 키워드 3~4개",
      items: { type: "string" },
    },
    shape: {
      type: "string",
      enum: [...CAPSULE_SHAPES],
      description: "날씨에 맞는 캡슐 형태",
    },
    color: {
      type: "string",
      description: "캡슐 본체 hex, 예: #1d4ed8",
    },
    accent: {
      type: "string",
      description: "하이라이트 hex, 예: #bfdbfe",
    },
  },
  required: ["quote", "keywords", "shape", "color", "accent"],
};

export async function generateCapsuleVibe(input: {
  weather: CapsuleWeather | null;
  recipient: string;
  letter: string;
}): Promise<CapsuleVibe> {
  const fallback = fallbackVibe(input);
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await withTimeout(
      ai.interactions.create({
        model: MODEL,
        input: buildPrompt(input),
        response_format: {
          type: "text",
          mime_type: "application/json",
          schema: vibeSchema,
        },
      }),
      VIBE_TIMEOUT_MS,
    );

    const parsed = JSON.parse(interaction.output_text ?? "{}") as unknown;
    return normalizeVibe(parsed, fallback);
  } catch (cause) {
    console.error("Gemini vibe failed", cause);
    return fallback;
  }
}

function buildPrompt(input: {
  weather: CapsuleWeather | null;
  recipient: string;
  letter: string;
}): string {
  const weather = input.weather;
  const letter = input.letter.trim().slice(0, 1200);
  const weatherLine = [
    weather?.condition ? `상태 ${weather.condition}` : null,
    weather?.tempC != null ? `기온 ${weather.tempC}°C` : null,
    weather?.humidity != null ? `습도 ${weather.humidity}%` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return `당신은 타임캡슐의 분위기 디자이너입니다. JSON만 출력하세요.

날씨: ${weatherLine || "알 수 없음"}
받는 사람: ${input.recipient.trim().slice(0, 40)}
편지:
${letter}

규칙:
- quote: 날씨·기온·습도에서 온 한국어 한마디. 1문장, 32자 이내. 편지 문장 인용/스포일러 금지.
- keywords: 봉인된 캡슐을 보고도 "아, 그 내용이구나" 하고 떠올릴 짧은 한국어 단어 3~4개. 공백 없이 1~6글자. 받는 사람 이름 금지. 날씨 단어만 나열하지 말 것. 편지 문장을 그대로 복사하지 말 것.
- shape: 날씨에 맞는 vial, droplet, orb, crystal, cloud, sun 중 하나.
  맑음/더움=sun, 구름/흐림=cloud, 비/소나기=droplet, 눈=crystal, 습함/안개=orb, 그 외=vial
- color, accent: 서로 대비되는 6자리 hex. 날씨 색감에 맞출 것.`;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Gemini timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
