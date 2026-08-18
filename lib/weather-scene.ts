import type { Capsule } from "@/lib/capsules";
import type { CapsuleWeather } from "@/lib/capsule-weather";

export type WeatherScene =
  | "sun"
  | "heat"
  | "cloud"
  | "overcast"
  | "rain"
  | "snow"
  | "mist";

export const SCENE_SKY: Record<WeatherScene, { from: string; via: string; to: string }> = {
  sun: { from: "#7ec8ff", via: "#c8e8ff", to: "#ffe7b0" },
  heat: { from: "#ff8a4c", via: "#ffc978", to: "#fff1c2" },
  cloud: { from: "#8eacc0", via: "#c5d6e2", to: "#e7eef3" },
  overcast: { from: "#5f7384", via: "#8ea0ae", to: "#c5d0d8" },
  rain: { from: "#2f4b63", via: "#4f6f86", to: "#8aa4b6" },
  snow: { from: "#9eb6c8", via: "#d5e4ef", to: "#f7fbff" },
  mist: { from: "#7f9b96", via: "#c5d7d2", to: "#e8f0ed" },
};

export type FloatPose = {
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
  duration: number;
  depth: number;
};

export function weatherScene(weather: CapsuleWeather | null | undefined): WeatherScene {
  const condition = weather?.condition ?? "";
  const temp = weather?.tempC;
  const humidity = weather?.humidity;

  if (condition.includes("눈")) return "snow";
  if (
    condition.includes("비") ||
    condition.includes("소나기") ||
    condition.includes("빗방울")
  ) {
    return "rain";
  }
  if (condition === "맑음" && temp != null && temp >= 30) return "heat";
  if (condition === "맑음") return "sun";
  if (condition.includes("흐림")) return "overcast";
  if (humidity != null && humidity >= 82) return "mist";
  if (condition.includes("구름")) return "cloud";
  return "cloud";
}

export function capsuleBuoyancy(openAt: string, now: number): number {
  const remaining = new Date(openAt).getTime() - now;
  if (remaining <= 0) {
    return 1;
  }

  const days = remaining / 86_400_000;
  return 0.1 + Math.exp(-days / 16) * 0.9;
}

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function layoutCapsules(capsules: Capsule[], now: number): Map<string, FloatPose> {
  const placed: { id: string; pose: FloatPose }[] = [];

  for (const capsule of capsules) {
    const hash = hashString(capsule.id);
    const buoyancy = capsuleBuoyancy(capsule.open_at, now);
    const pose: FloatPose = {
      x: 16 + ((hash % 6800) / 100),
      y: 10 + (1 - buoyancy) * 42,
      rotate: ((hash >> 7) % 17) - 8,
      scale: 1,
      delay: ((hash >> 3) % 280) / 100,
      duration: 4.2 + ((hash >> 11) % 28) / 10 + (1 - buoyancy) * 1.4,
      depth: 1 - buoyancy,
    };

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const clash = placed.some((other) => {
        const dx = other.pose.x - pose.x;
        const dy = (other.pose.y - pose.y) * 0.72;
        return dx * dx + dy * dy < 120;
      });
      if (!clash) {
        break;
      }
      pose.x = 12 + ((pose.x + 16 + attempt * 11) % 72);
    }

    placed.push({ id: capsule.id, pose });
  }

  return new Map(placed.map((item) => [item.id, item.pose]));
}
