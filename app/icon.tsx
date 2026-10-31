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
          background: "#030712",
          border: "1px solid #1e3a8a",
          borderRadius: 8,
          color: "#3b82f6",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 23,
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
