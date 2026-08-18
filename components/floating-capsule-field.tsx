"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  formatCountdown,
  isCapsuleOpen,
  type Capsule,
} from "@/lib/capsules";
import { layoutCapsules } from "@/lib/weather-scene";
import { readableCapsuleAccent, readableCapsuleColor } from "@/lib/capsule-vibe";
import { WeatherCapsuleArt } from "@/components/weather-capsule-art";
import { DeleteCapsuleButton } from "@/components/delete-capsule-button";

export function FloatingCapsuleField({
  capsules,
  now,
  onDeleted,
}: {
  capsules: Capsule[];
  now: number;
  onDeleted: (id: string) => void;
}) {
  const poseNow = Math.floor(now / 15_000) * 15_000;
  const poses = useMemo(() => layoutCapsules(capsules, poseNow), [capsules, poseNow]);

  return (
    <section
      className="relative mt-8 min-h-[640px] overflow-visible rounded-[2.5rem] bg-white/35 shadow-inner ring-1 ring-white/50"
      style={{ height: "min(78vh, 820px)" }}
      aria-label="떠 있는 타임캡슐"
    >
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 px-6 text-[11px] font-medium tracking-wide text-stone-700/80">
        수면 · 디데이가 가까운 캡슐
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 px-6 text-[11px] font-medium tracking-wide text-stone-700/80">
        깊은 곳 · 아직 먼 캡슐
      </div>

      {capsules.map((capsule) => {
        const pose = poses.get(capsule.id);
        if (!pose) return null;
        const open = isCapsuleOpen(capsule.open_at, now);
        const color = readableCapsuleColor(capsule.vibe.color);
        const accent = readableCapsuleAccent(capsule.vibe.accent);

        return (
          <article
            key={capsule.id}
            className="capsule-float group absolute z-20"
            style={{
              left: `${pose.x}%`,
              top: `${pose.y}%`,
              animationDelay: `${pose.delay}s`,
              animationDuration: `${pose.duration}s`,
              zIndex: open ? 30 : 20 + Math.round((1 - pose.depth) * 10),
            }}
          >
            <div
              className="relative flex w-36 flex-col items-center"
              style={{ transform: `translateX(-50%) rotate(${pose.rotate}deg)` }}
            >
              <div className="absolute -right-1 -top-1 z-30 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                <DeleteCapsuleButton
                  capsuleId={capsule.id}
                  senderUid={capsule.sender_uid}
                  compact
                  onDeleted={() => onDeleted(capsule.id)}
                />
              </div>
              <Link href={`/capsule/${capsule.id}`} className="relative block outline-none">
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
                  style={{ background: `${accent}cc` }}
                  aria-hidden="true"
                />
                <WeatherCapsuleArt
                  shape={capsule.vibe.shape}
                  color={color}
                  accent={accent}
                  sealed={!open}
                  seed={capsule.id}
                  weather={capsule.weather}
                  className="relative h-44 w-36 drop-shadow-xl"
                />
                <span className="sr-only">
                  {capsule.recipient}에게 보내는 캡슐
                  {open ? ", 열림" : `, ${formatCountdown(capsule.open_at, now)}`}
                </span>
              </Link>
              <div
                className="mt-1 max-w-[9rem] rounded-full bg-white/90 px-2.5 py-1 text-center"
                style={{ boxShadow: `0 8px 18px rgba(28,25,23,0.12), 0 0 0 2px ${color}` }}
              >
                <p className="truncate text-xs font-semibold text-stone-800">{capsule.recipient}</p>
                {capsule.vibe.keywords[0] ? (
                  <p className="truncate text-[10px] text-stone-600">
                    #{capsule.vibe.keywords.slice(0, 2).join(" #")}
                  </p>
                ) : (
                  <p className="truncate text-[10px] text-stone-600">
                    {open ? "열림" : formatCountdown(capsule.open_at, now)}
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
