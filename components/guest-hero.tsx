"use client";

import { useEffect, useState } from "react";
import { countCapsules } from "@/lib/capsules";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function GuestHero() {
  const [count, setCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const total = await countCapsules();
        if (!cancelled) {
          setCount(total);
        }
      } catch (cause) {
        console.error(cause);
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-3xl bg-white/45 px-8 py-12 shadow-xl shadow-stone-900/10 ring-1 ring-white/50 backdrop-blur-md">
      <p className="text-sm font-medium tracking-wide text-amber-800">타임캡슐</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-800">
        미래의 누군가에게,
        <br />
        오늘의 마음을 묻어요
      </h1>

      <div className="mt-8">
        {!loaded ? (
          <div className="h-16 w-64 animate-pulse rounded-2xl bg-amber-100/80" aria-hidden="true" />
        ) : count == null ? null : count === 0 ? (
          <p className="text-lg text-stone-500">아직 첫 캡슐이 없어요. 가장 먼저 묻어 보세요.</p>
        ) : (
          <p className="flex flex-wrap items-end gap-x-3 gap-y-1 text-stone-500">
            <span className="text-6xl font-semibold tabular-nums leading-none tracking-tight text-amber-900">
              {formatCount(count)}
            </span>
            <span className="pb-1 leading-snug">
              개의 캡슐이
              <br />
              지금까지 묻혔어요
            </span>
          </p>
        )}
      </div>

      <p className="mt-5 max-w-xl text-sm leading-relaxed text-stone-400">
        편지와 사진을 남기고 열람일을 정하면, 그날까지 봉인됩니다. 묻은 날의 날씨도 함께 저장돼요.
      </p>
    </section>
  );
}
