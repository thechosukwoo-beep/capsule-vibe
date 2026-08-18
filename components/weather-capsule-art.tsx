import {
  isDarkColor,
  isHexColor,
  readableCapsuleAccent,
  readableCapsuleColor,
  type CapsuleShape,
  type CapsuleVibe,
} from "@/lib/capsule-vibe";
import type { CapsuleWeather } from "@/lib/capsule-weather";
import { hashString, weatherScene } from "@/lib/weather-scene";

export function WeatherCapsuleArt({
  shape,
  color,
  accent,
  sealed = false,
  seed = "capsule",
  weather = null,
  className = "h-28 w-24",
}: {
  shape: CapsuleShape | null;
  color: string | null;
  accent: string | null;
  sealed?: boolean;
  seed?: string;
  weather?: CapsuleWeather | null;
  className?: string;
}) {
  const fill = readableCapsuleColor(color);
  const light = readableCapsuleAccent(accent);
  const ink = isDarkColor(fill) ? light : fill;
  const kind = shape ?? "vial";
  const hash = hashString(seed);
  const ribbon = ((hash >> 5) % 3) as 0 | 1 | 2;
  const liquid = 42 + ((hash >> 9) % 28);
  const scene = weatherScene(weather);

  return (
    <svg
      className={className}
      viewBox="0 0 160 200"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="80" cy="186" rx="36" ry="8" fill={fill} opacity="0.22" />

      <g>
        {kind === "sun" ? <SunBody fill={fill} light={light} /> : null}
        {kind === "cloud" ? <CloudBody fill={fill} light={light} /> : null}
        {kind === "droplet" ? <DropletBody fill={fill} light={light} /> : null}
        {kind === "crystal" ? <CrystalBody fill={fill} light={light} /> : null}
        {kind === "orb" ? <OrbBody fill={fill} light={light} /> : null}
        {kind === "vial" ? <VialBody fill={fill} light={light} liquid={liquid} /> : null}
        <path d="M58 46c4-18 40-18 44 0" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="6" strokeLinecap="round" />
      </g>

      {ribbon === 1 ? (
        <path d="M54 78c18 10 34 8 52-6" stroke={light} strokeWidth="5" strokeLinecap="round" />
      ) : null}
      {ribbon === 2 ? (
        <circle cx="80" cy="108" r="10" fill={light} opacity="0.55" />
      ) : null}

      {scene === "rain" ? <RainMotes light={light} /> : null}
      {scene === "snow" ? <SnowMotes light={light} /> : null}
      {scene === "sun" || scene === "heat" ? <SunMotes light={light} /> : null}

      {sealed ? (
        <g>
          <path
            d="M72 92c0-4.4 3.6-8 8-8s8 3.6 8 8v2h-3.2v-2a4.8 4.8 0 0 0-9.6 0v2H72v-2Z"
            fill={ink}
            opacity="0.9"
          />
          <rect x="70" y="94" width="20" height="16" rx="3" fill={ink} opacity="0.9" />
        </g>
      ) : (
        <circle cx="80" cy="102" r="5" fill={light} opacity="0.9" />
      )}
    </svg>
  );
}

function VialBody({
  fill,
  light,
  liquid,
}: {
  fill: string;
  light: string;
  liquid: number;
}) {
  return (
    <>
      <rect x="58" y="22" width="44" height="16" rx="5" fill={light} stroke="#1c1917" strokeOpacity="0.2" />
      <path d="M64 38h32l6 12H58l6-12Z" fill={light} />
      <rect x="50" y="48" width="60" height="122" rx="30" fill={fill} stroke="#1c1917" strokeOpacity="0.25" strokeWidth="3" />
      <rect x="58" y={48 + (100 - liquid) * 0.7} width="44" height={liquid} rx="18" fill={light} opacity="0.28" />
      <rect x="70" y="18" width="20" height="10" rx="3" fill={light} />
    </>
  );
}

function DropletBody({ fill, light }: { fill: string; light: string }) {
  return (
    <>
      <path
        d="M80 18c24 38 48 58 48 92a48 48 0 0 1-96 0c0-34 24-54 48-92Z"
        fill={fill}
        stroke="#1c1917"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path d="M68 64c10-18 18-30 14-8" stroke={light} strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="80" cy="154" rx="18" ry="8" fill={light} opacity="0.25" />
    </>
  );
}

function OrbBody({ fill, light }: { fill: string; light: string }) {
  return (
    <>
      <circle cx="80" cy="104" r="54" fill={fill} stroke="#1c1917" strokeOpacity="0.25" strokeWidth="3" />
      <ellipse cx="80" cy="104" rx="54" ry="16" stroke={light} strokeWidth="4" opacity="0.75" />
      <ellipse cx="80" cy="104" rx="36" ry="10" stroke={light} strokeWidth="2" opacity="0.4" />
      <circle cx="60" cy="82" r="11" fill={light} opacity="0.5" />
    </>
  );
}

function CrystalBody({ fill, light }: { fill: string; light: string }) {
  return (
    <>
      <path d="M80 16 132 74 80 176 28 74Z" fill={fill} stroke="#1c1917" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M80 16v160M28 74h104M52 74 80 16 108 74" stroke={light} strokeWidth="3" />
      <path d="M64 110 80 176 96 110" stroke={light} strokeWidth="2" opacity="0.6" />
    </>
  );
}

function CloudBody({ fill, light }: { fill: string; light: string }) {
  return (
    <>
      <ellipse cx="60" cy="100" rx="34" ry="30" fill={fill} stroke="#1c1917" strokeOpacity="0.22" strokeWidth="3" />
      <ellipse cx="102" cy="104" rx="38" ry="32" fill={fill} stroke="#1c1917" strokeOpacity="0.22" strokeWidth="3" />
      <ellipse cx="80" cy="74" rx="32" ry="28" fill={fill} stroke="#1c1917" strokeOpacity="0.22" strokeWidth="3" />
      <ellipse cx="80" cy="128" rx="50" ry="28" fill={fill} stroke="#1c1917" strokeOpacity="0.22" strokeWidth="3" />
      <ellipse cx="56" cy="80" rx="11" ry="8" fill={light} opacity="0.5" />
    </>
  );
}

function SunBody({ fill, light }: { fill: string; light: string }) {
  return (
    <>
      <g stroke={light} strokeWidth="7" strokeLinecap="round">
        <path d="M80 10v16M80 162v16M14 104h16M130 104h16M30 36l12 12M118 160l12 12M30 172l12-12M118 48l12-12" />
      </g>
      <circle cx="80" cy="104" r="46" fill={fill} stroke="#1c1917" strokeOpacity="0.22" strokeWidth="3" />
      <circle cx="64" cy="86" r="9" fill={light} opacity="0.5" />
    </>
  );
}

function RainMotes({ light }: { light: string }) {
  return (
    <g stroke={light} strokeWidth="2" strokeLinecap="round" opacity="0.7">
      <path d="M46 128v10M80 140v12M114 124v10" />
    </g>
  );
}

function SnowMotes({ light }: { light: string }) {
  return (
    <g fill={light} opacity="0.85">
      <circle cx="50" cy="132" r="2.4" />
      <circle cx="86" cy="146" r="2" />
      <circle cx="112" cy="128" r="2.6" />
    </g>
  );
}

function SunMotes({ light }: { light: string }) {
  return (
    <g fill={light} opacity="0.55">
      <circle cx="44" cy="58" r="2" />
      <circle cx="118" cy="70" r="1.6" />
      <circle cx="128" cy="120" r="2.2" />
    </g>
  );
}

export function CapsuleCover({
  vibe,
  sealed,
  coverUrl,
  seed,
  weather,
}: {
  vibe: CapsuleVibe;
  sealed: boolean;
  coverUrl?: string;
  seed?: string;
  weather?: CapsuleWeather | null;
}) {
  if (!sealed && coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverUrl} alt="" className="h-full w-full object-cover" />
    );
  }

  const color = vibe.color ?? "#fde68a";
  const accent = vibe.accent ?? "#fff7ed";

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden" style={{ backgroundColor: color }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 18%, ${accent}, transparent 62%)`,
        }}
      />
      <WeatherCapsuleArt
        shape={vibe.shape}
        color={vibe.color}
        accent={vibe.accent}
        sealed={sealed}
        seed={seed}
        weather={weather}
        className="relative h-28 w-24 drop-shadow-md"
      />
      {sealed ? (
        <span className="absolute bottom-3 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-stone-700">
          봉인됨
        </span>
      ) : null}
    </div>
  );
}

export function CapsuleKeywords({
  keywords,
  color,
  accent,
  align = "left",
}: {
  keywords: string[];
  color?: string | null;
  accent?: string | null;
  align?: "left" | "center";
}) {
  if (keywords.length === 0) {
    return null;
  }

  const bg = isHexColor(accent) ? accent : "#fef3c7";
  const fg = isDarkColor(bg)
    ? "#fff7ed"
    : isHexColor(color) && isDarkColor(color)
      ? color
      : "#44403c";

  return (
    <ul
      className={`mt-3 flex flex-wrap gap-1.5 ${align === "center" ? "justify-center" : ""}`}
    >
      {keywords.map((keyword) => (
        <li
          key={keyword}
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ backgroundColor: bg, color: fg }}
        >
          #{keyword}
        </li>
      ))}
    </ul>
  );
}

export function CapsuleQuote({ quote }: { quote: string | null }) {
  if (!quote) {
    return null;
  }

  return (
    <p className="mt-3 text-sm leading-relaxed text-stone-600">“{quote}”</p>
  );
}
