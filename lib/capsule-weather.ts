export type CapsuleWeather = {
  condition: string | null;
  tempC: number | null;
  humidity: number | null;
  observedAt: string | null;
};

export type WeatherPlace = {
  name: string;
  lat: number;
  lng: number;
  source: "gps" | "default";
};

export type LiveWeatherPayload = {
  weather: CapsuleWeather | null;
  location: WeatherPlace | null;
};

export function hasWeather(weather: CapsuleWeather | null | undefined): boolean {
  if (!weather) {
    return false;
  }

  return (
    Boolean(weather.condition) ||
    weather.tempC != null ||
    weather.humidity != null
  );
}

export function formatTempC(tempC: number | null): string | null {
  if (tempC == null || Number.isNaN(tempC)) {
    return null;
  }

  return `${tempC.toFixed(1).replace(/\.0$/, "")}°`;
}

export function weatherSummary(weather: CapsuleWeather): string {
  const parts = [
    weather.condition,
    formatTempC(weather.tempC),
    weather.humidity != null ? `습도 ${weather.humidity}%` : null,
  ].filter((part): part is string => Boolean(part));

  return parts.join(" · ");
}
