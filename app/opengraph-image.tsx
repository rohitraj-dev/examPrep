import { ImageResponse } from "next/og";

export const alt = "ExamPrep — BCA 3rd Semester PYQs & AI Practice Questions";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#030712",
          color: "#f9fafb",
          padding: "64px",
          textAlign: "center",
        }}
      >
        <div style={{ color: "#93c5fd", fontSize: 86, fontWeight: 800 }}>
          ExamPrep
        </div>
        <div style={{ marginTop: 24, fontSize: 38, color: "#d1d5db" }}>
          BCA 3rd Semester PYQs & AI Practice Questions
        </div>
      </div>
    ),
    size,
  );
}
