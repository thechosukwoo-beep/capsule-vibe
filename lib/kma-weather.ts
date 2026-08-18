export type WeatherSnapshot = {
  condition: string;
  tempC: number | null;
  humidity: number | null;
  observedAt: string | null;
};

type KstClock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

type NcstItem = {
  category?: string;
  obsrValue?: string;
  baseDate?: string;
  baseTime?: string;
};

type FcstItem = {
  category?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
  baseDate?: string;
  baseTime?: string;
};

const KMA_BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const SEOUL_HALL = { lat: 37.5665, lng: 126.978 };

export function resolveWeatherPoint(
  lat?: number | null,
  lng?: number | null,
): { lat: number; lng: number; usedFallback: boolean } {
  if (isFiniteNumber(lat) && isFiniteNumber(lng) && isInKorea(lat, lng)) {
    return { lat, lng, usedFallback: false };
  }

  return { ...SEOUL_HALL, usedFallback: true };
}

const PTY_LABEL: Record<string, string> = {
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "4": "소나기",
  "5": "빗방울",
  "6": "빗방울/눈날림",
  "7": "눈날림",
};
const SKY_LABEL: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
};

export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const RE = 6371.00877;
  const GRID = 5;
  const SLAT1 = 30;
  const SLAT2 = 60;
  const OLON = 126;
  const OLAT = 38;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

export async function fetchCurrentWeather(
  lat?: number | null,
  lng?: number | null,
): Promise<WeatherSnapshot | null> {
  const serviceKey = process.env.KMA_SERVICE_KEY?.trim();
  if (!serviceKey) {
    console.error("Missing KMA_SERVICE_KEY");
    return null;
  }

  const requested = resolveWeatherPoint(lat, lng);
  const weather = await loadWeather(serviceKey, requested);
  if (weather) {
    return weather;
  }

  if (!requested.usedFallback) {
    return loadWeather(serviceKey, SEOUL_HALL);
  }

  return null;
}

async function loadWeather(
  serviceKey: string,
  point: { lat: number; lng: number },
): Promise<WeatherSnapshot | null> {
  const { nx, ny } = latLngToGrid(point.lat, point.lng);

  const [ncst, fcst] = await Promise.all([
    fetchNcst(serviceKey, nx, ny),
    fetchFcst(serviceKey, nx, ny),
  ]);

  const tempC = parseWeatherNumber(ncst?.T1H ?? fcst?.T1H);
  const humidity = parseWeatherInteger(ncst?.REH ?? fcst?.REH);
  const condition = weatherCondition(ncst?.PTY ?? fcst?.PTY, fcst?.SKY);
  const observedAt = toObservedAt(ncst?.baseDate, ncst?.baseTime);

  if (!condition && tempC == null && humidity == null) {
    return null;
  }

  return {
    condition: condition ?? "날씨 기록",
    tempC,
    humidity,
    observedAt,
  };
}

async function fetchNcst(
  serviceKey: string,
  nx: number,
  ny: number,
): Promise<(Record<string, string> & { baseDate?: string; baseTime?: string }) | null> {
  let clock = getKstClock();
  if (clock.minute < 10) {
    clock = addKstMinutes(clock, -60);
  }
  clock.minute = 0;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const items = await requestKma<NcstItem>(serviceKey, "/getUltraSrtNcst", {
      nx,
      ny,
      base_date: formatDate(clock),
      base_time: formatTime(clock),
      numOfRows: "20",
    });

    if (items && items.length > 0) {
      const values: Record<string, string> & { baseDate?: string; baseTime?: string } =
        {};
      for (const item of items) {
        if (item.category && item.obsrValue != null) {
          values[item.category] = item.obsrValue;
        }
        values.baseDate ??= item.baseDate;
        values.baseTime ??= item.baseTime;
      }
      return values;
    }

    clock = addKstMinutes(clock, -60);
  }

  return null;
}

async function fetchFcst(
  serviceKey: string,
  nx: number,
  ny: number,
): Promise<Record<string, string> | null> {
  let clock = addKstMinutes(getKstClock(), -15);
  clock.minute = Math.floor(clock.minute / 10) * 10;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const items = await requestKma<FcstItem>(serviceKey, "/getUltraSrtFcst", {
      nx,
      ny,
      base_date: formatDate(clock),
      base_time: formatTime(clock),
      numOfRows: "60",
    });

    if (items && items.length > 0) {
      const firstSlot = items.reduce((soonest, item) => {
        const stamp = `${item.fcstDate ?? ""}${item.fcstTime ?? ""}`;
        return !soonest || stamp < soonest ? stamp : soonest;
      }, "");
      const values: Record<string, string> = {};
      for (const item of items) {
        const stamp = `${item.fcstDate ?? ""}${item.fcstTime ?? ""}`;
        if (stamp !== firstSlot || !item.category || item.fcstValue == null) {
          continue;
        }
        values[item.category] = item.fcstValue;
      }
      return values;
    }

    clock = addKstMinutes(clock, -10);
  }

  return null;
}

async function requestKma<T>(
  serviceKey: string,
  path: string,
  params: { nx: number; ny: number; base_date: string; base_time: string; numOfRows: string },
): Promise<T[] | null> {
  const url = new URL(`${KMA_BASE}${path}`);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", params.numOfRows);
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", params.base_date);
  url.searchParams.set("base_time", params.base_time);
  url.searchParams.set("nx", String(params.nx));
  url.searchParams.set("ny", String(params.ny));

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      response?: {
        header?: { resultCode?: string };
        body?: { items?: { item?: T | T[] } };
      };
    };

    if (payload.response?.header?.resultCode !== "00") {
      return null;
    }

    return asItemArray(payload.response.body?.items?.item);
  } catch (cause) {
    console.error("KMA request failed", path, cause);
    return null;
  }
}

function weatherCondition(pty?: string, sky?: string): string | null {
  if (pty && pty !== "0" && PTY_LABEL[pty]) {
    return PTY_LABEL[pty];
  }
  if (sky && SKY_LABEL[sky]) {
    return SKY_LABEL[sky];
  }
  return null;
}

function asItemArray<T>(item: T | T[] | undefined): T[] {
  if (!item) {
    return [];
  }
  return Array.isArray(item) ? item : [item];
}

function getKstClock(now = new Date()): KstClock {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function addKstMinutes(clock: KstClock, delta: number): KstClock {
  const next = new Date(
    Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute) +
      delta * 60 * 1000,
  );

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
    hour: next.getUTCHours(),
    minute: next.getUTCMinutes(),
  };
}

function formatDate(clock: KstClock): string {
  return `${clock.year}${pad(clock.month)}${pad(clock.day)}`;
}

function formatTime(clock: KstClock): string {
  return `${pad(clock.hour)}${pad(clock.minute)}`;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toObservedAt(baseDate?: string, baseTime?: string): string | null {
  if (!baseDate || baseDate.length !== 8 || !baseTime || baseTime.length < 4) {
    return null;
  }

  const iso = `${baseDate.slice(0, 4)}-${baseDate.slice(4, 6)}-${baseDate.slice(6, 8)}T${baseTime.slice(0, 2)}:${baseTime.slice(2, 4)}:00+09:00`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseWeatherNumber(value?: string): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseWeatherInteger(value?: string): number | null {
  const parsed = parseWeatherNumber(value);
  return parsed == null ? null : Math.round(parsed);
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInKorea(lat: number, lng: number): boolean {
  return lat >= 33 && lat <= 39.6 && lng >= 124 && lng <= 132.2;
}
