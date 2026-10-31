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
        }}
      >
        <div
          style={{
            position: "relative",
            width: 96,
            height: 120,
            borderRadius: 16,
            background: "#3b82f6",
            padding: "28px 18px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 34,
              height: 34,
              background: "#030712",
              borderBottomLeftRadius: 10,
            }}
          />
          <div style={{ height: 8, width: 52, borderRadius: 4, background: "#dbeafe" }} />
          <div style={{ height: 8, width: 62, borderRadius: 4, background: "#dbeafe" }} />
          <div style={{ height: 8, width: 44, borderRadius: 4, background: "#dbeafe" }} />
        </div>
      </div>
    ),
    size,
  );
}
