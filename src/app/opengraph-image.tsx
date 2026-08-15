import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "The Music Creative @ FIU";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated at request/build time via Satori — no static asset to keep in
// sync with the brand colors, and every existing on-site photo is too low
// resolution (largest is 610x630) to stand up as a 1200x630 share card.
export default async function Image() {
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
          backgroundColor: "#10141f",
          backgroundImage:
            "radial-gradient(circle at 50% 30%, #1c2136 0%, #10141f 70%)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 64,
            height: 6,
            backgroundColor: "#f2b134",
            marginBottom: 32,
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -1,
            color: "#eef0f5",
          }}
        >
          THE MUSIC CREATIVE
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            fontWeight: 700,
            color: "#f2b134",
            marginTop: 12,
          }}
        >
          @ FIU
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#8a97b3",
            marginTop: 24,
          }}
        >
          Producers · DJs · Songwriters · Industry Pros
        </div>
      </div>
    ),
    { ...size }
  );
}
