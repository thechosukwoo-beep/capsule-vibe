"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formatCountdown,
  formatOpenAt,
  getCountdownParts,
  isCapsuleOpen,
  type Capsule,
} from "@/lib/capsules";
import { CapsuleWeatherCard, CapsuleWeatherLine } from "@/components/capsule-weather";
import {
  CapsuleKeywords,
  CapsuleQuote,
  WeatherCapsuleArt,
} from "@/components/weather-capsule-art";
import { DeleteCapsuleButton } from "@/components/delete-capsule-button";
import { useNow } from "@/components/use-auth";

const isDev = process.env.NODE_ENV === "development";

function SealedMark({
  shape,
  color,
  accent,
  seed,
  weather,
}: {
  shape: Capsule["vibe"]["shape"];
  color: string | null;
  accent: string | null;
  seed: string;
  weather: Capsule["weather"];
}) {
  return (
    <div
      className="mx-auto flex h-40 w-40 items-center justify-center rounded-full shadow-inner"
      style={{
        background: `radial-gradient(circle at 50% 30%, ${accent ?? "#fde68a"}, ${color ?? "#fbbf24"})`,
      }}
    >
      <WeatherCapsuleArt
        shape={shape}
        color={color}
        accent={accent}
        sealed
        seed={seed}
        weather={weather}
        className="h-32 w-28"
      />
    </div>
  );
}

function OpenedContent({
  capsule,
  preview,
}: {
  capsule: Capsule;
  preview?: boolean;
}) {
  return (
    <main className="mt-6 overflow-hidden rounded-3xl bg-white/55 shadow-xl shadow-stone-900/10 ring-1 ring-white/50 backdrop-blur-md">
      {capsule.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capsule.images[0].public_url}
          alt=""
          className="h-56 w-full object-cover"
        />
      ) : (
        <div
          className="flex h-40 items-center justify-center"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${capsule.vibe.accent ?? "#fde68a"}, ${capsule.vibe.color ?? "#fbbf24"})`,
          }}
        >
          <WeatherCapsuleArt
            shape={capsule.vibe.shape}
            color={capsule.vibe.color}
            accent={capsule.vibe.accent}
            seed={capsule.id}
            weather={capsule.weather}
            className="h-28 w-24"
          />
        </div>
      )}
      <div className="px-8 py-10">
        {preview ? (
          <p className="text-xs font-medium tracking-wide text-amber-700">
            개발 미리보기
          </p>
        ) : (
          <p className="text-sm font-medium tracking-wide text-amber-800">열린 캡슐</p>
        )}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
          {capsule.recipient}에게
        </h1>
        <p className="mt-2 text-sm text-stone-500">{formatOpenAt(capsule.open_at)}</p>
        <CapsuleQuote quote={capsule.vibe.quote} />
        <CapsuleKeywords
          keywords={capsule.vibe.keywords}
          color={capsule.vibe.color}
          accent={capsule.vibe.accent}
        />
        <div className="mt-8 rounded-2xl bg-amber-50/80 px-5 py-6">
          <p className="text-xs font-medium tracking-wide text-stone-400">편지</p>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-700">
            {capsule.letter}
          </p>
        </div>
        <CapsuleWeatherCard weather={capsule.weather} />
        {capsule.images.length > 0 ? (
          <div className="mt-8">
            <p className="text-xs font-medium tracking-wide text-stone-400">사진</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {capsule.images.map((image) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={image.public_url}
                  src={image.public_url}
                  alt=""
                  className="h-36 w-full rounded-2xl object-cover"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export function CapsuleDetail({ capsule }: { capsule: Capsule }) {
  const router = useRouter();
  const now = useNow();
  const [forceOpen, setForceOpen] = useState(false);
  const open = isCapsuleOpen(capsule.open_at, now) || forceOpen;
  const parts = getCountdownParts(capsule.open_at, now);
  const remaining = formatCountdown(capsule.open_at, now);
  const deleteButton = (
    <div className="mt-6 text-center">
      <DeleteCapsuleButton
        capsuleId={capsule.id}
        senderUid={capsule.sender_uid}
        onDeleted={() => router.replace("/")}
      />
    </div>
  );

  if (open) {
    return (
      <div className="mx-auto w-full max-w-lg px-6 py-16">
        <Link href="/" className="text-sm text-stone-400 transition hover:text-stone-600">
          ← 대시보드
        </Link>
        <OpenedContent capsule={capsule} preview={forceOpen && !isCapsuleOpen(capsule.open_at, now)} />
        {deleteButton}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <Link href="/" className="text-sm text-stone-400 transition hover:text-stone-600">
        ← 대시보드
      </Link>
      <main className="relative mt-6 overflow-hidden rounded-3xl bg-white/50 px-8 py-14 text-center shadow-xl shadow-stone-900/10 ring-1 ring-white/50 backdrop-blur-md">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background: `linear-gradient(to bottom, ${capsule.vibe.accent ?? "#fde68a"}cc, transparent)`,
          }}
        />
        <div className="relative">
          <SealedMark
            shape={capsule.vibe.shape}
            color={capsule.vibe.color}
            accent={capsule.vibe.accent}
            seed={capsule.id}
            weather={capsule.weather}
          />
          <p className="mt-8 text-sm font-medium tracking-wide text-amber-800">봉인된 캡슐</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
            아직 기간이 남았어요
          </h1>
          <p className="mt-3 text-stone-500">
            {capsule.recipient}에게 보내는 캡슐은
            <br />
            {formatOpenAt(capsule.open_at)}에 열려요
          </p>
          <CapsuleQuote quote={capsule.vibe.quote} />
          <CapsuleKeywords
            keywords={capsule.vibe.keywords}
            color={capsule.vibe.color}
            accent={capsule.vibe.accent}
            align="center"
          />
          <p className="mt-2 text-sm font-medium text-amber-900">앞으로 {remaining}</p>
          <CapsuleWeatherLine weather={capsule.weather} />
          <div className="mt-8 grid grid-cols-4 gap-2">
            {[
              { label: "일", value: parts.days },
              { label: "시간", value: parts.hours },
              { label: "분", value: parts.minutes },
              { label: "초", value: parts.seconds },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-amber-50 px-2 py-4">
                <p className="text-2xl font-semibold tabular-nums text-stone-800">
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-stone-400">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm leading-relaxed text-stone-400">
            열람일이 되기 전에는 편지와 사진을 볼 수 없어요
          </p>
          {isDev ? (
            <button
              type="button"
              onClick={() => setForceOpen(true)}
              className="mt-10 text-[11px] text-stone-300/50 transition hover:text-stone-400/80"
            >
              바로보기
            </button>
          ) : null}
        </div>
      </main>
      {deleteButton}
    </div>
  );
}
