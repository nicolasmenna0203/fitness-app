import { ImageResponse } from "next/og";

// Ícono de la pantalla de inicio del iPhone. iOS le aplica sus propias esquinas.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#E8590C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 104,
            height: 104,
            borderRadius: 52,
            border: "17px solid #111111",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 20, border: "17px solid #111111" }} />
        </div>
      </div>
    ),
    size,
  );
}
