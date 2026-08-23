import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Node runtime (not edge, hence no `export const runtime`) so this can read
// local assets straight off disk and inline them as base64 data URIs --
// Satori (what ImageResponse renders with) has no way to resolve a local
// file path or a CSS custom property, only real <img src> values. Matches
// Next's own documented pattern for local assets in opengraph-image
// (https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image#using-nodejs-runtime-with-local-assets):
// top-level await, read once at module scope since none of these change
// per-request.
export const alt = "The Music Creative @ FIU";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const publicDir = join(process.cwd(), "public");
const toDataUrl = async (relativePath: string, mime: string) =>
  `data:${mime};base64,${await readFile(join(publicDir, relativePath), "base64")}`;

const [logoDataUrl, photoDataUrl, starDataUrl, micDataUrl] = await Promise.all(
  [
    toDataUrl("logo-rebrand.png", "image/png"),
    toDataUrl("photos/concert-band.jpg", "image/jpeg"),
    toDataUrl("charms/star.png", "image/png"),
    toDataUrl("charms/mic-vintage.png", "image/png"),
  ]
);

// Reuses the exact same photo + scrim treatment as the homepage hero
// (src/app/page.tsx) so the share card reads as "a crop of the real site"
// instead of a generic centered-text title slide, which is what this
// replaced. Satori can't read the CSS custom properties in globals.css, so
// hex values are hardcoded to match — see that file's @theme block for the
// source of truth (navy-950, gold, ivory, steel-light respectively).
// Layout/values verified by rendering locally with a throwaway Node script
// against next/og's ImageResponse before shipping, since none of this can
// be exercised through a real request in dev.
export default async function Image() {
  const navy950 = "20,23,47"; // #14172f as an rgb() triplet, for alpha stops

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#14172f",
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori
            only supports plain <img>, not next/image */}
        <img
          src={photoDataUrl}
          width={1200}
          height={630}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            objectFit: "cover",
            // Same bias as the homepage hero -- the source photo is a tall
            // portrait shot with the stage ~1/3 down; default center-crop
            // shows more crowd than band in this wide/short frame.
            objectPosition: "50% 41%",
          }}
        />
        {/* Left-to-right scrim so text stays legible while the photo still
            reads clearly on the right -- mirrors page.tsx's hero exactly. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to right, rgba(${navy950},1) 0%, rgba(${navy950},0.82) 42%, rgba(${navy950},0.35) 68%, rgba(${navy950},0.08) 100%)`,
          }}
        />
        {/* Bottom-to-top scrim, same as the hero's second overlay layer. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(to top, rgba(${navy950},0.55) 0%, rgba(${navy950},0) 45%)`,
          }}
        />
        {/* Faint vignette for the same CRT-edge character as the site-wide
            .crt-overlay in globals.css -- just the radial falloff, not the
            repeating-linear-gradient scanlines (untested in Satori and not
            worth the risk on a static share card). */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        {/* Two of the site's scattered chrome charms as accents on the
            photo side -- opacity bumped well above the 0.12 used for
            in-page background texture (see CharmScatter) since this has to
            read at thumbnail size in a link preview, not sit ambient
            behind scrolling content. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={starDataUrl}
          width={92}
          height={90}
          alt=""
          style={{
            position: "absolute",
            top: 46,
            right: 90,
            opacity: 0.55,
            transform: "rotate(-12deg)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={micDataUrl}
          width={70}
          height={126}
          alt=""
          style={{
            position: "absolute",
            bottom: 54,
            right: 150,
            opacity: 0.5,
            transform: "rotate(8deg)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            maxWidth: 680,
            padding: "0 0 0 72px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoDataUrl}
            width={84}
            height={84}
            alt=""
            style={{ marginBottom: 22 }}
          />
          <div
            style={{
              display: "flex",
              width: 64,
              height: 6,
              backgroundColor: "#2436db",
              marginBottom: 26,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: -1.5,
              lineHeight: 1.05,
              color: "#f2e7df",
            }}
          >
            The Music Creative
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              fontWeight: 800,
              textTransform: "uppercase",
              color: "#2436db",
              marginTop: 6,
            }}
          >
            @ FIU
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#8f92ae",
              marginTop: 22,
            }}
          >
            Producers · DJs · Songwriters · Industry Pros
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
