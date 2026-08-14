import Image from "next/image";

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
        </div>

        <div className="relative mx-auto w-full max-w-xs sm:max-w-none">
          <div className="overflow-hidden rounded-3xl border border-navy-800 bg-navy-900">
            <Image
              src="/logo.jpg"
              alt="The Music Creative @ FIU"
              width={480}
              height={480}
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

      <div className="mt-16 space-y-4 text-steel-light sm:mt-20">
        <p>
          We host workshops, networking events, beat showcases, and
          collaborations that help members sharpen their skills, share
          opportunities, and gain exposure. Whether you&apos;re looking to
          produce, perform, or connect with others in the industry, The
          Music Creative is where ideas turn into reality.
        </p>
        <p className="font-semibold text-ivory">
          Our Goal: Build a supportive music community at FIU that empowers
          students to take their creativity to the next level.
        </p>
      </div>
    </div>
  );
}
