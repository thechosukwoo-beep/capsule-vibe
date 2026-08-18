import type { CapsuleWeather } from "@/lib/capsule-weather";

export const CAPSULE_SHAPES = [
  "vial",
  "droplet",
  "orb",
  "crystal",
  "cloud",
  "sun",
] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];

export type CapsuleVibe = {
  quote: string | null;
  keywords: string[];
  shape: CapsuleShape | null;
  color: string | null;
  accent: string | null;
};

const STOP_WORDS = new Set([
  "그리고",
  "그래서",
  "그러나",
  "하지만",
  "오늘",
  "내일",
  "어제",
  "정말",
  "너무",
  "아주",
  "그냥",
  "조금",
  "많이",
  "있어",
  "없어",
  "이다",
  "하는",
  "할게",
  "거야",
  "거야",
  "나는",
  "내가",
  "너는",
  "네가",
  "우리",
  "다시",
  "안녕",
  "있어.",
]);

const LOOKS: Record<
  CapsuleShape,
  { color: string; accent: string; quote: string }
> = {
  sun: {
    color: "#ea580c",
    accent: "#fde68a",
    quote: "햇살이 뚜껑 사이로 스며든 하루",
  },
  cloud: {
    color: "#64748b",
    accent: "#e2e8f0",
    quote: "구름 아래 잠시 멈춰 둔 마음",
  },
  droplet: {
    color: "#1d4ed8",
    accent: "#bfdbfe",
    quote: "빗방울이 편지를 감싸던 날",
  },
  crystal: {
    color: "#0369a1",
    accent: "#e0f2fe",
    quote: "차가운 공기 속에 남겨 둔 온기",
  },
  orb: {
    color: "#0f766e",
    accent: "#99f6e4",
    quote: "습한 공기만큼 짙었던 하루",
  },
  vial: {
    color: "#b45309",
    accent: "#fde68a",
    quote: "이 날의 공기를 함께 묻어 두었어요",
  },
};

export function emptyVibe(): CapsuleVibe {
  return {
    quote: null,
    keywords: [],
    shape: null,
    color: null,
    accent: null,
  };
}

export function hasCapsuleLook(vibe: CapsuleVibe | null | undefined): boolean {
  return Boolean(vibe?.shape && vibe.color);
}

export function isCapsuleShape(value: string | null | undefined): value is CapsuleShape {
  return CAPSULE_SHAPES.includes(value as CapsuleShape);
}

export function isHexColor(value: string | null | undefined): value is string {
  return Boolean(value && /^#[0-9A-Fa-f]{6}$/.test(value));
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114;
}

export function isDarkColor(hex: string): boolean {
  return luminance(hex) < 150;
}

export function readableCapsuleColor(value: string | null | undefined): string {
  const hex = isHexColor(value) ? value : LOOKS.vial.color;
  if (luminance(hex) < 168) {
    return hex;
  }

  const raw = hex.replace("#", "");
  const mix = 0.42;
  const channel = (start: number) => {
    const from = Number.parseInt(raw.slice(start, start + 2), 16);
    return Math.round(from * (1 - mix) + 41 * mix)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${channel(0)}${channel(2)}${channel(4)}`;
}

export function readableCapsuleAccent(value: string | null | undefined): string {
  return isHexColor(value) ? value : LOOKS.vial.accent;
}

export function pickShape(weather: CapsuleWeather | null): CapsuleShape {
  const condition = weather?.condition ?? "";
  const temp = weather?.tempC;
  const humidity = weather?.humidity;

  if (condition.includes("눈")) return "crystal";
  if (
    condition.includes("비") ||
    condition.includes("소나기") ||
    condition.includes("빗방울")
  ) {
    return "droplet";
  }
  if (condition === "맑음") return "sun";
  if (condition.includes("구름") || condition.includes("흐림")) return "cloud";
  if (humidity != null && humidity >= 80) return "orb";
  if (temp != null && temp >= 28) return "sun";
  return "vial";
}

export function fallbackVibe(input: {
  weather: CapsuleWeather | null;
  letter?: string;
}): CapsuleVibe {
  const shape = pickShape(input.weather);
  const look = LOOKS[shape];

  return {
    quote: look.quote,
    keywords: hintKeywords(input.letter),
    shape,
    color: look.color,
    accent: look.accent,
  };
}

export function normalizeVibe(
  raw: unknown,
  fallback: CapsuleVibe,
): CapsuleVibe {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const shape = isCapsuleShape(String(data.shape ?? ""))
    ? (data.shape as CapsuleShape)
    : fallback.shape;
  const color = isHexColor(String(data.color ?? ""))
    ? String(data.color)
    : fallback.color;
  const accent = isHexColor(String(data.accent ?? ""))
    ? String(data.accent)
    : fallback.accent;
  const quote = cleanQuote(data.quote) ?? fallback.quote;
  const keywords = cleanKeywords(data.keywords);
  const look = shape ? LOOKS[shape] : LOOKS.vial;

  return {
    quote,
    keywords: keywords.length > 0 ? keywords : fallback.keywords,
    shape: shape ?? "vial",
    color: color ?? look.color,
    accent: accent ?? look.accent,
  };
}

function cleanQuote(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const quote = value.trim().replace(/\s+/g, " ");
  if (!quote) {
    return null;
  }

  return quote.length > 42 ? `${quote.slice(0, 41)}…` : quote;
}

function cleanKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const keyword = item.trim().replace(/^#/, "").replace(/\s+/g, "");
    if (keyword.length < 1 || keyword.length > 8) {
      continue;
    }
    if (seen.has(keyword)) {
      continue;
    }

    seen.add(keyword);
    keywords.push(keyword);
    if (keywords.length >= 4) {
      break;
    }
  }

  return keywords;
}

function hintKeywords(letter: string | undefined): string[] {
  if (!letter) {
    return [];
  }

  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const token of letter.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/)) {
    if (token.length < 2 || token.length > 6 || STOP_WORDS.has(token)) {
      continue;
    }
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    keywords.push(token);
    if (keywords.length >= 3) {
      break;
    }
  }

  return keywords;
}
