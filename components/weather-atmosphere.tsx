"use client";

import { useMemo } from "react";
import type { CapsuleWeather } from "@/lib/capsule-weather";
import { weatherScene, SCENE_SKY } from "@/lib/weather-scene";

export function WeatherAtmosphere({
  weather,
  className = "",
}: {
  weather: CapsuleWeather | null | undefined;
  className?: string;
}) {
  const scene = weatherScene(weather);
  const sky = SCENE_SKY[scene];
  const drops = useMemo(() => Array.from({ length: 42 }, (_, index) => index), []);
  const flakes = useMemo(() => Array.from({ length: 28 }, (_, index) => index), []);

  return (
    <div
      className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 transition-[background] duration-700"
        style={{
          background: `linear-gradient(180deg, ${sky.from} 0%, ${sky.via} 46%, ${sky.to} 100%)`,
        }}
      />

      {scene === "sun" || scene === "heat" ? (
        <div className={`weather-sun ${scene === "heat" ? "weather-sun-hot" : ""}`}>
          <div className="weather-sun-core" />
          <div className="weather-sun-rays" />
        </div>
      ) : null}

      {scene === "heat" ? <div className="weather-heat" /> : null}

      {scene === "cloud" || scene === "overcast" || scene === "mist" ? (
        <>
          <div className="weather-cloud weather-cloud-a" />
          <div className="weather-cloud weather-cloud-b" />
          <div className="weather-cloud weather-cloud-c" />
        </>
      ) : null}

      {scene === "rain" || scene === "overcast" ? (
        <div className="weather-rain">
          {drops.map((drop) => (
            <span
              key={drop}
              style={{
                left: `${(drop * 23) % 100}%`,
                animationDelay: `${(drop % 12) * -0.18}s`,
                animationDuration: `${0.7 + (drop % 5) * 0.12}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      {scene === "snow" ? (
        <div className="weather-snow">
          {flakes.map((flake) => (
            <span
              key={flake}
              style={{
                left: `${(flake * 17) % 100}%`,
                animationDelay: `${(flake % 16) * -0.4}s`,
                animationDuration: `${8 + (flake % 7)}s`,
                width: `${6 + (flake % 6)}px`,
                height: `${6 + (flake % 6)}px`,
              }}
            />
          ))}
        </div>
      ) : null}

      {scene === "mist" || (weather?.humidity != null && weather.humidity >= 75) ? (
        <div className="weather-mist" />
      ) : null}

      <div className="weather-depth" />
    </div>
  );
}
