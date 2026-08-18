import { NextResponse } from "next/server";
import { fetchCurrentWeather, resolveWeatherPoint } from "@/lib/kma-weather";
import { reverseGeocode } from "@/lib/reverse-geocode";
import type { LiveWeatherPayload, WeatherPlace } from "@/lib/capsule-weather";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseOptionalNumber(searchParams.get("lat"));
  const lng = parseOptionalNumber(searchParams.get("lng"));
  const point = resolveWeatherPoint(lat, lng);

  try {
    const [weather, placeName] = await Promise.all([
      fetchCurrentWeather(lat, lng),
      reverseGeocode(point.lat, point.lng),
    ]);

    const location: WeatherPlace = {
      name: placeName ?? (point.usedFallback ? "서울" : "현재 위치"),
      lat: point.lat,
      lng: point.lng,
      source: point.usedFallback ? "default" : "gps",
    };

    const payload: LiveWeatherPayload = { weather, location };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (cause) {
    console.error(cause);
    return NextResponse.json(
      { weather: null, location: null } satisfies LiveWeatherPayload,
      { status: 200 },
    );
  }
}

function parseOptionalNumber(value: string | null): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
