"use client";

import { WeatherAtmosphere } from "@/components/weather-atmosphere";
import { useLiveWeather } from "@/components/use-live-weather";

export function WeatherWorld({ children }: { children: React.ReactNode }) {
  const { payload } = useLiveWeather();

  return (
    <>
      <WeatherAtmosphere weather={payload?.weather} />
      {children}
    </>
  );
}
