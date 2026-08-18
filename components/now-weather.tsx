"use client";

import {
  formatTempC,
  hasWeather,
} from "@/lib/capsule-weather";
import { WeatherMark } from "@/components/capsule-weather";
import { useLiveWeather } from "@/components/use-live-weather";

export function NowWeather() {
  const { payload, loading, requestingLocation, useMyLocation } = useLiveWeather();
  const weather = payload?.weather ?? null;
  const location = payload?.location ?? null;
  const ready = hasWeather(weather);
  const temp = formatTempC(weather?.tempC ?? null);

  if (loading && !payload) {
    return (
      <div
        className="h-12 w-64 animate-pulse rounded-full bg-white/40"
        aria-hidden="true"
      />
    );
  }

  if (!ready && !location) {
    return null;
  }

  return (
    <section
      className="inline-flex max-w-full flex-wrap items-center gap-3 rounded-full bg-white/45 px-4 py-2 shadow-sm ring-1 ring-white/50 backdrop-blur-md"
      aria-label="지금 날씨"
    >
      <WeatherMark condition={weather?.condition ?? null} className="h-5 w-5 text-sky-950" />
      <p className="text-sm font-medium text-stone-800">
        <span className="tabular-nums">{temp ?? "—"}</span>
        <span className="mx-1.5 text-stone-400">·</span>
        {weather?.condition ?? "날씨 없음"}
        {weather?.humidity != null ? (
          <span className="text-stone-500"> · 습도 {weather.humidity}%</span>
        ) : null}
      </p>
      {location ? (
        <p className="text-sm text-stone-600">
          {location.name}
          {location.source === "default" ? (
            <button
              type="button"
              onClick={() => void useMyLocation()}
              disabled={requestingLocation}
              className="ml-2 text-sky-900/80 underline-offset-2 hover:underline disabled:opacity-60"
            >
              {requestingLocation ? "찾는 중" : "내 위치"}
            </button>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
