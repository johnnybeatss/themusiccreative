import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import VideoWheel from "@/components/VideoWheel";

export default function HomePage() {
  return (
    <div>
      <div className="grid gap-10 sm:grid-cols-2 sm:items-center">
        <div>
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
            className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-navy-950 transition-colors hover:bg-gold-light"
          >
            Join The Music Creative
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xs sm:max-w-none">
          <div className="aspect-[61/63] overflow-hidden rounded-3xl border border-navy-800 bg-navy-900">
            <Image
              src="/photos/concert-band.jpg"
              alt="A live show hosted by The Music Creative"
              width={610}
              height={630}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="absolute -bottom-6 left-1/2 w-56 -translate-x-1/2 rounded-xl border border-navy-800 bg-navy-900 p-4 sm:-bottom-4 sm:-left-4 sm:translate-x-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gold">
              Est. 2025
            </p>
            <p className="mt-1 text-sm text-ivory">
              Producers · DJs · Songwriters · Industry Pros
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-8 sm:mt-20 sm:grid-cols-5 sm:items-center sm:gap-10">
        <p className="text-steel-light sm:col-span-3">
          We host workshops, networking events, beat showcases, and
          collaborations that help members sharpen their skills, share
          opportunities, and gain exposure. Whether you&apos;re looking to
          produce, perform, or connect with others in the industry, The
          Music Creative is where ideas turn into reality.
        </p>
        <Reveal delay={0.05}>
          <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-navy-800 sm:col-span-2">
            <Image
              src="/photos/guitar-lounge.jpg"
              alt="Members playing acoustic guitar together"
              width={400}
              height={300}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
      </div>

      <div className="mt-10 grid gap-8 sm:grid-cols-5 sm:items-center sm:gap-10">
        <Reveal delay={0.05}>
          <div className="order-2 aspect-[4/3] overflow-hidden rounded-2xl border border-navy-800 sm:order-1 sm:col-span-2">
            <Image
              src="/photos/group-photo.jpg"
              alt="The Music Creative members outside Studio24"
              width={400}
              height={300}
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>
        <p className="order-1 font-semibold text-ivory sm:order-2 sm:col-span-3">
          Our Goal: Build a supportive music community at FIU that empowers
          students to take their creativity to the next level.
        </p>
      </div>

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
          <VideoWheel />
        </Reveal>
      </div>
    </div>
  );
}
