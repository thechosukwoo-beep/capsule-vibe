import { NextResponse } from "next/server";
import { generateCapsuleVibe } from "@/lib/gemini-vibe";
import { fallbackVibe } from "@/lib/capsule-vibe";
import type { CapsuleWeather } from "@/lib/capsule-weather";
import { getFirebaseUidFromIdToken } from "@/lib/verify-firebase-user";

export async function POST(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const uid = await getFirebaseUidFromIdToken(token);
  if (!uid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      weather?: CapsuleWeather | null;
      recipient?: string;
      letter?: string;
    };
    const recipient = body.recipient?.trim() ?? "";
    const letter = body.letter?.trim() ?? "";

    if (!recipient || !letter) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const vibe = await generateCapsuleVibe({
      weather: body.weather ?? null,
      recipient,
      letter,
    });

    return NextResponse.json(
      { vibe },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (cause) {
    console.error(cause);
    return NextResponse.json({
      vibe: fallbackVibe({ weather: null }),
    });
  }
}
