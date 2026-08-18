import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://capsule-vibe-one.vercel.app";

export const SITE_NAME = "캡슐 바이브";

export const SITE_TAGLINE = "사진과 편지를 묻고, 열람일에 함께 열어요";

export const SITE_DESCRIPTION =
  "미래의 누군가에게 오늘의 마음을 묻는 타임캡슐. 편지와 사진을 남기고 열람일을 정하면 그날까지 봉인되고, 묻은 날의 날씨도 함께 저장됩니다.";

export const SITE_KEYWORDS = [
  "캡슐 바이브",
  "타임캡슐",
  "디지털 타임캡슐",
  "편지",
  "추억",
  "미래에게",
  "사진 편지",
  "Capsule Vibe",
];

const ogImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
};

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

export function getGaMeasurementId(): string | undefined {
  const measurementId =
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  return measurementId || undefined;
}

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path,
  type = "website",
  robots,
}: {
  title?: string;
  description?: string;
  path: string;
  type?: "website" | "article";
  robots?: Metadata["robots"];
}): Metadata {
  const ogTitle = title ?? SITE_NAME;

  return {
    ...(title ? { title } : {}),
    description,
    alternates: {
      canonical: path,
    },
    ...(robots ? { robots } : {}),
    openGraph: {
      type,
      locale: "ko_KR",
      siteName: SITE_NAME,
      url: path,
      title: ogTitle,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}
