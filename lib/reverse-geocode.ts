type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  borough?: string;
  suburb?: string;
  city_district?: string;
  quarter?: string;
  neighbourhood?: string;
  state?: string;
  province?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
};

type BigDataCloudResponse = {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
};

const cache = new Map<string, string>();

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const name =
    (await reverseGeocodeNominatim(lat, lng)) ??
    (await reverseGeocodeBigData(lat, lng));

  if (name) {
    cache.set(key, name);
  }

  return name;
}

async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "ko");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "capsule-vibe/0.1 (weather location display)",
      },
      cache: "force-cache",
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as NominatimResponse;
    return formatPlace(
      payload.address?.state ??
        payload.address?.province ??
        payload.address?.city ??
        payload.address?.town,
      payload.address?.borough ??
        payload.address?.city_district ??
        payload.address?.county ??
        payload.address?.municipality ??
        payload.address?.suburb ??
        payload.address?.town ??
        payload.address?.village,
    );
  } catch (cause) {
    console.error("Nominatim reverse geocode failed", cause);
    return null;
  }
}

async function reverseGeocodeBigData(
  lat: number,
  lng: number,
): Promise<string | null> {
  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client",
  );
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("localityLanguage", "ko");

  try {
    const response = await fetch(url, {
      cache: "force-cache",
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as BigDataCloudResponse;
    return formatPlace(
      payload.principalSubdivision ?? payload.city,
      payload.locality && payload.locality !== payload.city
        ? payload.locality
        : payload.city,
    );
  } catch (cause) {
    console.error("BigDataCloud reverse geocode failed", cause);
    return null;
  }
}

function formatPlace(
  region?: string | null,
  district?: string | null,
): string | null {
  const area = simplifyRegion(region);
  const local = simplifyDistrict(district);

  if (area && local && local !== area && !local.startsWith(area)) {
    return `${area} ${local}`;
  }

  return local ?? area;
}

function simplifyRegion(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value
    .replace(/특별자치도$|특별자치시$|특별시$|광역시$|자치시$/, "")
    .replace(/도$/, "")
    .trim();

  return trimmed || value.trim() || null;
}

function simplifyDistrict(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}
