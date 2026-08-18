import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #7dd3fc 0%, #c8e8ff 48%, #fde68a 100%)",
        }}
      >
        <div
          style={{
            width: 92,
            height: 92,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: "radial-gradient(circle at 50% 28%, #fde68a, #f59e0b)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 64,
              borderRadius: 999,
              background: "linear-gradient(180deg, #fff7ed 0%, #f59e0b 100%)",
              border: "4px solid rgba(255,255,255,0.65)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
