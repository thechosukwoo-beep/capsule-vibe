"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveWeatherPayload } from "@/lib/capsule-weather";

const REFRESH_MS = 10 * 60 * 1000;
const STALE_MS = 5 * 60 * 1000;

let cached: { at: number; payload: LiveWeatherPayload | null } = {
  at: 0,
  payload: null,
};

export function useLiveWeather() {
  const [payload, setPayload] = useState<LiveWeatherPayload | null>(cached.payload);
  const [loading, setLoading] = useState(!cached.payload);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const positionRef = useRef<{ lat: number; lng: number } | null>(null);
  const gpsLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load(position: { lat: number; lng: number } | null) {
      const next = await fetchLiveWeather(position);
      if (cancelled || !next) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (!position && gpsLoadedRef.current) {
        return;
      }
      if (position) {
        gpsLoadedRef.current = true;
      }
      cached = { at: Date.now(), payload: next };
      setPayload(next);
      setLoading(false);
    }

    if (cached.payload && Date.now() - cached.at < STALE_MS) {
      setPayload(cached.payload);
      setLoading(false);
    }

    void (async () => {
      await load(null);
      const position = await readBrowserPosition();
      if (cancelled) return;
      if (position) {
        positionRef.current = position;
        await load(position);
      }
    })();

    const refresh = window.setInterval(() => {
      void load(positionRef.current);
    }, REFRESH_MS);

    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - cached.at > STALE_MS
      ) {
        void load(positionRef.current);
      }
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  async function useMyLocation() {
    setRequestingLocation(true);
    try {
      const position = await readBrowserPosition();
      if (!position) return;
      positionRef.current = position;
      const next = await fetchLiveWeather(position);
      if (next) {
        gpsLoadedRef.current = true;
        cached = { at: Date.now(), payload: next };
        setPayload(next);
      }
    } finally {
      setRequestingLocation(false);
    }
  }

  return {
    payload,
    loading,
    requestingLocation,
    useMyLocation,
  };
}

async function fetchLiveWeather(
  position: { lat: number; lng: number } | null,
): Promise<LiveWeatherPayload | null> {
  try {
    const params = new URLSearchParams();
    if (position) {
      params.set("lat", String(position.lat));
      params.set("lng", String(position.lng));
    }
    const query = params.toString();
    const response = await fetch(query ? `/api/weather?${query}` : "/api/weather");
    if (!response.ok) return null;
    return (await response.json()) as LiveWeatherPayload;
  } catch (cause) {
    console.error(cause);
    return null;
  }
}

async function readBrowserPosition(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), 6000);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60 * 1000, timeout: 5500 },
    );
  });
}
