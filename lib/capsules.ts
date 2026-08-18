import { getSupabase } from "@/lib/supabase";
import type { CapsuleWeather } from "@/lib/capsule-weather";
import { isCapsuleShape, type CapsuleVibe } from "@/lib/capsule-vibe";

export type CapsuleImage = {
  public_url: string;
  sort_order: number;
};

export type Capsule = {
  id: string;
  sender_uid: string;
  recipient: string;
  letter: string;
  open_at: string;
  created_at: string;
  weather: CapsuleWeather;
  vibe: CapsuleVibe;
  images: CapsuleImage[];
};

type CapsuleRow = {
  id: string;
  sender_uid: string;
  recipient: string;
  letter?: string | null;
  open_at: string;
  created_at: string;
  weather_condition: string | null;
  weather_temp_c: number | string | null;
  weather_humidity: number | null;
  weather_observed_at: string | null;
  vibe_quote: string | null;
  vibe_keywords: string[] | null;
  capsule_shape: string | null;
  capsule_color: string | null;
  capsule_accent: string | null;
  capsule_images: { public_url: string; sort_order: number }[] | null;
};

const capsuleFields = `
  id,
  sender_uid,
  recipient,
  open_at,
  created_at,
  weather_condition,
  weather_temp_c,
  weather_humidity,
  weather_observed_at,
  vibe_quote,
  vibe_keywords,
  capsule_shape,
  capsule_color,
  capsule_accent,
  capsule_images (
    public_url,
    sort_order
  )
`;

const capsuleSelect = `
  letter,
  ${capsuleFields}
`;

const capsuleListSelect = capsuleFields;

function mapCapsule(row: CapsuleRow): Capsule {
  const images = [...(row.capsule_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    sender_uid: row.sender_uid,
    recipient: row.recipient,
    letter: row.letter ?? "",
    open_at: row.open_at,
    created_at: row.created_at,
    weather: {
      condition: row.weather_condition,
      tempC: parseNullableNumber(row.weather_temp_c),
      humidity: row.weather_humidity,
      observedAt: row.weather_observed_at,
    },
    vibe: {
      quote: row.vibe_quote,
      keywords: Array.isArray(row.vibe_keywords) ? row.vibe_keywords : [],
      shape: isCapsuleShape(row.capsule_shape) ? row.capsule_shape : null,
      color: row.capsule_color,
      accent: row.capsule_accent,
    },
    images,
  };
}

function parseNullableNumber(value: number | string | null): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function countCapsules(): Promise<number> {
  const { count, error } = await getSupabase()
    .from("capsules")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listCapsules(): Promise<Capsule[]> {
  const { data, error } = await getSupabase()
    .from("capsules")
    .select(capsuleListSelect)
    .order("open_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as CapsuleRow[]).map(mapCapsule);
}

export async function getCapsule(id: string): Promise<Capsule | null> {
  const { data, error } = await getSupabase()
    .from("capsules")
    .select(capsuleSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapCapsule(data as CapsuleRow) : null;
}

export function isCapsuleOpen(openAt: string, now = Date.now()): boolean {
  return new Date(openAt).getTime() <= now;
}

export function formatOpenAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export function formatCountdown(openAt: string, now = Date.now()): string {
  const remaining = new Date(openAt).getTime() - now;
  if (remaining <= 0) {
    return "지금 열 수 있어요";
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}일 ${hours}시간 ${minutes}분`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${seconds}초`;
  }
  return `${minutes}분 ${seconds}초`;
}

export function getCountdownParts(openAt: string, now = Date.now()) {
  const remaining = Math.max(0, new Date(openAt).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
