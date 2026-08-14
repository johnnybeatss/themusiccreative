export default function HomePage() {
  return (
    <div>
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full bg-gold opacity-20 blur-3xl"
        />
        <h1 className="relative bg-gradient-to-r from-gold-light via-gold to-ivory bg-clip-text font-display text-4xl tracking-wide text-transparent sm:text-6xl">
          THE MUSIC CREATIVE
        </h1>
      </div>
      <div className="mt-3 h-1 w-16 bg-gold" />
      <div className="mt-6 space-y-4 text-steel-light">
        <p>
          The Music Creative is a student-led community designed to bring
          together producers, artists, DJs, songwriters, and music industry
          professionals on campus. Our mission is to create a space where
          creative individuals can collaborate, network, and grow within the
          music industry.
        </p>
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
