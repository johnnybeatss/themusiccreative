import type { Metadata } from "next";
import { Anton, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import FeaturedTrackBar from "@/components/FeaturedTrackBar";
import { createClient } from "@/lib/supabase/server";

const TRACK_BUCKET = "weekly-track";

async function getFeaturedTrack() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("weekly_track")
    .select(
      "track_title, artist_name, storage_path, artist_instagram_url, apple_music_url, spotify_url"
    )
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    track_title: data.track_title,
    artist_name: data.artist_name,
    artist_instagram_url: data.artist_instagram_url,
    apple_music_url: data.apple_music_url,
    spotify_url: data.spotify_url,
    audio_url: supabase.storage
      .from(TRACK_BUCKET)
      .getPublicUrl(data.storage_path).data.publicUrl,
  };
}

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
  logo: `${SITE_URL}/logo.jpg`,
  description: SITE_DESCRIPTION,
  sameAs: [INSTAGRAM_URL, PANTHER_CONNECT_URL],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const track = await getFeaturedTrack();

  return (
    <html lang="en" className={`${anton.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col bg-navy-950 font-sans text-ivory antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Nav />
        <main className="relative mx-auto w-full max-w-4xl flex-1 px-4 py-10">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
        {track && <FeaturedTrackBar track={track} />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
