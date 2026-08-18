import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const ogSize = {
  width: 1200,
  height: 630,
};

export const ogContentType = "image/png";

export const ogAlt = `${SITE_NAME} — ${SITE_TAGLINE}`;

async function loadKoreanFont() {
  const response = await fetch(
    "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-SemiBold.woff",
    { cache: "force-cache" },
  );

  if (!response.ok) {
    return null;
  }

  return response.arrayBuffer();
}

export async function createOgImage() {
  const fontData = await loadKoreanFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #8ecfff 0%, #c8e8ff 48%, #ffe7a3 100%)",
          color: "#1c1917",
          fontFamily: fontData ? "Pretendard" : "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: 120,
            width: 280,
            height: 280,
            borderRadius: 280,
            background: "rgba(255, 248, 220, 0.7)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            left: -40,
            width: 220,
            height: 220,
            borderRadius: 220,
            background: "rgba(255, 255, 255, 0.35)",
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 28,
              letterSpacing: 6,
              color: "#9a3412",
              fontWeight: 600,
            }}
          >
            타임캡슐
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 18,
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              maxWidth: 640,
              fontSize: 32,
              lineHeight: 1.45,
              color: "#57534e",
            }}
          >
            {SITE_TAGLINE}
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 90,
            bottom: 70,
            width: 210,
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "radial-gradient(circle at 50% 28%, #fde68a, #f59e0b)",
            boxShadow: "0 24px 50px rgba(146, 64, 14, 0.25)",
          }}
        >
          <div
            style={{
              width: 92,
              height: 168,
              display: "flex",
              borderRadius: 999,
              background: "linear-gradient(180deg, #fff7ed 0%, #fbbf24 55%, #b45309 100%)",
              border: "6px solid rgba(255,255,255,0.55)",
            }}
          />
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: fontData
        ? [
            {
              name: "Pretendard",
              data: fontData,
              style: "normal",
              weight: 600,
            },
          ]
        : undefined,
    },
  );
}
