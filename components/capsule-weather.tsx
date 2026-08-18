import {
  formatTempC,
  hasWeather,
  weatherSummary,
  type CapsuleWeather,
} from "@/lib/capsule-weather";

export function WeatherMark({
  condition,
  className = "h-6 w-6",
}: {
  condition: string | null;
  className?: string;
}) {
  const kind = weatherIconKind(condition);

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {kind === "sun" ? (
        <>
          <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 4.2v1.6M12 18.2v1.6M4.2 12h1.6M18.2 12h1.6M6.4 6.4l1.1 1.1M16.5 16.5l1.1 1.1M17.6 6.4l-1.1 1.1M7.5 16.5l-1.1 1.1"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {kind === "cloud" ? (
        <path
          d="M7.8 17.5h8.3a3.4 3.4 0 0 0 .4-6.8 4.6 4.6 0 0 0-8.8-1.1A3.2 3.2 0 0 0 7.8 17.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      ) : null}
      {kind === "rain" ? (
        <>
          <path
            d="M7.8 14.4h8.3a3.4 3.4 0 0 0 .4-6.8 4.6 4.6 0 0 0-8.8-1.1A3.2 3.2 0 0 0 7.8 14.4Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M8.6 17.2v1.6M12 16.6v2.2M15.4 17.2v1.6"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {kind === "snow" ? (
        <>
          <path
            d="M7.8 14.2h8.3a3.4 3.4 0 0 0 .4-6.8 4.6 4.6 0 0 0-8.8-1.1A3.2 3.2 0 0 0 7.8 14.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M8.8 17.4h.01M12 16.8h.01M15.2 17.4h.01M10.4 19.2h.01M13.6 19.2h.01"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}

export function weatherIconKind(
  condition: string | null,
): "sun" | "cloud" | "rain" | "snow" {
  if (!condition) return "cloud";
  if (condition.includes("눈")) return "snow";
  if (
    condition.includes("비") ||
    condition.includes("소나기") ||
    condition.includes("빗방울")
  ) {
    return "rain";
  }
  if (condition === "맑음") return "sun";
  return "cloud";
}

export function CapsuleWeatherCard({
  weather,
  className = "mt-8",
}: {
  weather: CapsuleWeather;
  className?: string;
}) {
  if (!hasWeather(weather)) {
    return null;
  }

  const temp = formatTempC(weather.tempC);

  return (
    <div className={`rounded-2xl bg-sky-50/80 px-5 py-5 ${className}`}>
      <p className="text-xs font-medium tracking-wide text-stone-400">묻은 날의 날씨</p>
      <div className="mt-3 flex items-center gap-3 text-sky-900">
        <WeatherMark condition={weather.condition} />
        <div>
          <p className="text-lg font-semibold tracking-tight">
            {weather.condition ?? "날씨 기록"}
            {temp ? ` ${temp}` : ""}
          </p>
          {weather.humidity != null ? (
            <p className="mt-0.5 text-sm text-sky-800/80">습도 {weather.humidity}%</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CapsuleWeatherLine({ weather }: { weather: CapsuleWeather }) {
  if (!hasWeather(weather)) {
    return null;
  }

  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-sky-800/80">
      <span className="inline-flex text-sky-900">
        <WeatherMark condition={weather.condition} className="h-4 w-4" />
      </span>
      {weatherSummary(weather)}
    </p>
  );
}
