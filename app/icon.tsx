import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #7dd3fc 0%, #fde68a 100%)",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 12,
            height: 20,
            borderRadius: 999,
            background: "linear-gradient(180deg, #fff7ed 0%, #f59e0b 100%)",
            border: "2px solid rgba(255,255,255,0.7)",
          }}
        />
      </div>
    ),
    size,
  );
}
