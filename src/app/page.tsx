import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import VideoWheel, { type FeedVideo } from "@/components/VideoWheel";
import NextEventCountdown, {
  type NextEvent,
} from "@/components/NextEventCountdown";
import TrackSubmitSection from "@/components/trackSubmit/TrackSubmitSection";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "feed-videos";

async function getFeedVideos(): Promise<FeedVideo[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feed_videos")
    .select("id, storage_path, caption, instagram_url")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("Failed to load feed videos:", error.message);
    return [];
  }
  return (data ?? []).map((v) => ({
    id: v.id,
    caption: v.caption,
    instagram_url: v.instagram_url,
    video_url: supabase.storage.from(BUCKET).getPublicUrl(v.storage_path)
      .data.publicUrl,
  }));
}

// Soonest event that hasn't happened yet — powers the homepage countdown
// banner. `gte` (not `gt`) so an event starting in the next few seconds
// doesn't briefly vanish from the homepage right before the events list
// would also drop it.
async function getNextEvent(): Promise<NextEvent | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, name, date, location")
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export default async function HomePage() {
  const [videos, nextEvent] = await Promise.all([
    getFeedVideos(),
    getNextEvent(),
  ]);

  return (
    <div>
      {/* Full-bleed: breaks out of <main>'s max-w-4xl column to span the
          entire viewport width, regardless of how narrow the page content
          column is. left-1/2 + -translate-x-1/2 re-centers a 100vw-wide box
          under a constrained parent. */}
      <div className="relative left-1/2 -mt-10 min-h-[380px] w-screen -translate-x-1/2 overflow-hidden border-b border-navy-800 sm:min-h-[440px]">
        <Image
          src="/photos/concert-band.jpg"
          alt="A live show hosted by The Music Creative"
          fill
          priority
          // Source photo is a tall portrait shot — the performer on stage
          // sits around a third of the way down, with the crowd's
          // silhouettes filling the bottom half+. Default center-crop (50%
          // 50%) was splitting the difference and cropping into the stage,
          // showing more crowd than performer. Biasing toward the top
          // keeps the singer/band in frame in this wide, short hero strip.
          className="object-cover object-[50%_25%]"
        />
        {/* Dark scrim behind the text (left side), fading out toward the
            right so the photo itself still reads clearly. */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/75 to-navy-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />

        {nextEvent && <NextEventCountdown event={nextEvent} />}

        <div className="relative mx-auto flex h-full max-w-4xl flex-col justify-center px-6 py-12 sm:px-10">
          <div className="sm:max-w-lg">
            <h1 className="font-display text-4xl leading-tight tracking-wide text-ivory sm:text-5xl">
              WHERE IDEAS TURN INTO REALITY
            </h1>
            <div className="mt-4 h-1 w-16 bg-gold" />
            <p className="mt-6 text-steel-light">
              A student-led community bringing together producers, artists,
              DJs, songwriters, and music industry professionals on campus —
              collaborate, network, and grow within the music industry.
            </p>
            <Link
              href="/join"
              className="mt-6 inline-block w-fit rounded-full bg-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-navy-950 transition-colors hover:bg-gold-light"
            >
              Join The Music Creative
            </Link>
          </div>
        </div>

        <div className="absolute bottom-6 right-6 hidden rounded-xl border border-navy-800 bg-navy-900/90 p-4 backdrop-blur-sm sm:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold">
            Est. 2025
          </p>
          <p className="mt-1 text-sm text-ivory">
            Producers · DJs · Songwriters · Industry Pros
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-2 sm:items-center sm:gap-10">
        <div>
          <p className="font-display text-3xl leading-snug tracking-wide text-ivory sm:text-4xl">
            WHAT WE DO
          </p>
          <div className="mt-3 h-1 w-16 bg-gold" />
          <p className="mt-4 text-lg font-semibold text-ivory">
            We host workshops, networking events, beat showcases, and
            collaborations that help members sharpen their skills, share
            opportunities, and gain exposure. Whether you&apos;re looking to
            produce, perform, or connect with others in the industry, The
            Music Creative is where ideas turn into reality.
          </p>
        </div>
        <Reveal delay={0.05}>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-navy-800">
            <Image
              src="/photos/studio-group.jpg"
              alt="The Music Creative members outside Studio24 after a group workout"
              width={828}
              height={992}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-2 sm:items-center sm:gap-10">
        <Reveal delay={0.05}>
          <div className="order-2 aspect-[4/3] overflow-hidden rounded-2xl border border-navy-800 sm:order-1">
            <Image
              src="/photos/stage-purple.jpg"
              alt="A band performing live at a Music Creative show"
              width={828}
              height={1093}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
        <div className="order-1 sm:order-2">
          <p className="font-display text-3xl leading-snug tracking-wide text-ivory sm:text-4xl">
            OUR GOAL
          </p>
          <div className="mt-3 h-1 w-16 bg-gold" />
          <p className="mt-4 text-lg font-semibold text-ivory">
            Build a supportive music community at FIU that empowers
            students to take their creativity to the next level.
          </p>
        </div>
      </div>

      <TrackSubmitSection />

      {videos.length > 0 && (
        <div className="mt-16 sm:mt-20">
          <h2 className="font-display text-2xl tracking-wide text-ivory">
            STRAIGHT FROM THE FEED
          </h2>
          <div className="mt-2 h-1 w-16 bg-gold" />
          <p className="mt-3 max-w-md text-sm text-steel-light">
            Drag through, or just watch it drift — tap any clip to catch the
            full video on Instagram.
          </p>
          <Reveal delay={0.1}>
            <VideoWheel videos={videos} />
          </Reveal>
        </div>
      )}
    </div>
  );
}
