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
          background: "#030712",
          border: "5px solid #1e3a8a",
          borderRadius: 44,
          color: "#3b82f6",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 132,
          fontWeight: 900,
          lineHeight: 1,
        }}
      >
        E
      </div>
    ),
    size,
  );
}
