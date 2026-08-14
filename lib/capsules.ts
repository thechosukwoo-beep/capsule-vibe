import { getSupabase } from "@/lib/supabase";

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
  images: CapsuleImage[];
};

type CapsuleRow = {
  id: string;
  sender_uid: string;
  recipient: string;
  letter: string;
  open_at: string;
  created_at: string;
  capsule_images: { public_url: string; sort_order: number }[] | null;
};

const capsuleSelect = `
  id,
  sender_uid,
  recipient,
  letter,
  open_at,
  created_at,
  capsule_images (
    public_url,
    sort_order
  )
`;

function mapCapsule(row: CapsuleRow): Capsule {
  const images = [...(row.capsule_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  return {
    id: row.id,
    sender_uid: row.sender_uid,
    recipient: row.recipient,
    letter: row.letter,
    open_at: row.open_at,
    created_at: row.created_at,
    images,
  };
}

export async function listCapsules(): Promise<Capsule[]> {
  const { data, error } = await getSupabase()
    .from("capsules")
    .select(capsuleSelect)
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
