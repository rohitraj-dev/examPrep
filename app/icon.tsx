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
        }}
      >
        <div
          style={{
            position: "relative",
            width: 17,
            height: 21,
            borderRadius: 3,
            background: "#3b82f6",
            padding: "5px 3px 3px",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 6,
              height: 6,
              background: "#030712",
              borderBottomLeftRadius: 2,
            }}
          />
          <div style={{ height: 2, width: 9, borderRadius: 1, background: "#dbeafe" }} />
          <div style={{ height: 2, width: 11, borderRadius: 1, background: "#dbeafe" }} />
          <div style={{ height: 2, width: 8, borderRadius: 1, background: "#dbeafe" }} />
        </div>
      </div>
    ),
    size,
  );
}
