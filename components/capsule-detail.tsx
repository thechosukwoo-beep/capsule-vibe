"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatCountdown,
  formatOpenAt,
  getCountdownParts,
  isCapsuleOpen,
  type Capsule,
} from "@/lib/capsules";
import { useNow } from "@/components/use-auth";

const isDev = process.env.NODE_ENV === "development";

function SealedMark() {
  return (
    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-b from-amber-100 to-amber-200 shadow-inner">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-800 text-amber-50 shadow-md">
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M8 11V8a4 4 0 1 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </div>
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
    <main className="mt-6 overflow-hidden rounded-3xl border border-amber-100 bg-white/80 shadow-xl shadow-amber-900/10">
      {capsule.images[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capsule.images[0].public_url}
          alt=""
          className="h-56 w-full object-cover"
        />
      ) : (
        <div className="h-28 bg-gradient-to-br from-amber-100 to-amber-50" />
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
        <div className="mt-8 rounded-2xl bg-amber-50/80 px-5 py-6">
          <p className="text-xs font-medium tracking-wide text-stone-400">편지</p>
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-700">
            {capsule.letter}
          </p>
        </div>
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
  const now = useNow();
  const [forceOpen, setForceOpen] = useState(false);
  const open = isCapsuleOpen(capsule.open_at, now) || forceOpen;
  const parts = getCountdownParts(capsule.open_at, now);
  const remaining = formatCountdown(capsule.open_at, now);

  if (open) {
    return (
      <div className="mx-auto w-full max-w-lg px-6 py-16">
        <Link href="/" className="text-sm text-stone-400 transition hover:text-stone-600">
          ← 대시보드
        </Link>
        <OpenedContent capsule={capsule} preview={forceOpen && !isCapsuleOpen(capsule.open_at, now)} />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16">
      <Link href="/" className="text-sm text-stone-400 transition hover:text-stone-600">
        ← 대시보드
      </Link>
      <main className="relative mt-6 overflow-hidden rounded-3xl border border-amber-100 bg-white/80 px-8 py-14 text-center shadow-xl shadow-amber-900/10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-amber-100/80 to-transparent" />
        <div className="relative">
          <SealedMark />
          <p className="mt-8 text-sm font-medium tracking-wide text-amber-800">봉인된 캡슐</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-800">
            아직 기간이 남았어요
          </h1>
          <p className="mt-3 text-stone-500">
            {capsule.recipient}에게 보내는 캡슐은
            <br />
            {formatOpenAt(capsule.open_at)}에 열려요
          </p>
          <p className="mt-2 text-sm font-medium text-amber-900">앞으로 {remaining}</p>
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
    </div>
  );
}
