import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import FeaturedTrackBar from "@/components/FeaturedTrackBar";
import { getSitePlayer } from "@/lib/sitePlayer";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const SITE_URL = "https://themusiccreative.org";
const SITE_TITLE = "The Music Creative @ FIU";
const SITE_DESCRIPTION =
  "A student-led community for producers, artists, DJs, songwriters, and music industry pros at FIU.";
const INSTAGRAM_URL = "https://instagram.com/themusiccreativefiu";
const PANTHER_CONNECT_URL =
  "https://fiu.campuslabs.com/engage/organization/themusiccreative";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_TITLE}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_TITLE,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

// Helps Google recognize "The Music Creative @ FIU" as a distinct entity
// (not just a page) and connects it to the accounts that already exist —
// Instagram and the official FIU Panther Connect listing.
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_TITLE,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-rebrand.png`,
  description: SITE_DESCRIPTION,
  sameAs: [INSTAGRAM_URL, PANTHER_CONNECT_URL],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cached 60s + invalidated on every spotlight/battle change (sitePlayer.ts).
  const { track, votingBattleId } = await getSitePlayer();

  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-clip bg-navy-950 font-sans text-ivory antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Nav />
        <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-10">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        {track && <FeaturedTrackBar track={track} votingBattleId={votingBattleId} />}
        {/* Retro CRT-TV vignette + scanlines, see globals.css — purely
            decorative (pointer-events: none), doesn't affect any
            interaction on the page underneath it. */}
        <div aria-hidden className="crt-overlay" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
