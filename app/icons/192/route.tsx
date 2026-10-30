import { ImageResponse } from "next/og";

export function GET() {
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
          color: "#93c5fd",
          fontSize: 72,
          fontWeight: 800,
        }}
      >
        EP
      </div>
    ),
    {
      width: 192,
      height: 192,
    },
  );
}
