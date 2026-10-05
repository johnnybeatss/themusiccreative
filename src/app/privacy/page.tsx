import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Privacy Policy";
const DESCRIPTION =
  "What information The Music Creative @ FIU collects through this site, how it's used, and who it's shared with.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/privacy"),
};

// Written to match what the site ACTUALLY collects — if a new form or
// third-party service gets added, update this page in the same change.
export default function PrivacyPage() {
  return (
    <LegalPage title="PRIVACY POLICY" updated="October 5, 2026">
      <p>
        The Music Creative @ FIU (&ldquo;TMC,&rdquo; &ldquo;we&rdquo;) is a
        student-led music organization at Florida International University.
        This page explains what we collect through themusiccreative.org and
        what we do with it. Short version: we only collect what you type into
        our forms, we use it to run the club, and we don&apos;t sell it.
      </p>

      <section>
        <h2>WHAT WE COLLECT</h2>
        <p className="mt-2">Only what you choose to submit:</p>
        <ul>
          <li>
            <strong>Club sign-up (/join):</strong> name, FIU email, FIU
            student ID, phone number, major, year, and your answers about your
            creative background and interests.
          </li>
          <li>
            <strong>E-Board applications (/join-team):</strong> name, email,
            phone (optional), the role you&apos;re interested in, your answers,
            and your resume file.
          </li>
          <li>
            <strong>DJ sign-ups (/dj-booking):</strong> name, email, phone
            (optional), links to your work, and your experience.
          </li>
          <li>
            <strong>Event RSVPs:</strong> name, email, guest count, and any
            notes you add.
          </li>
          <li>
            <strong>Track submissions:</strong> track title, artist name,
            Instagram handle, streaming links, and the audio file you upload.
          </li>
          <li>
            <strong>Feedback (/feedback):</strong> your message, and your name
            only if you choose to add it.
          </li>
          <li>
            <strong>Weekly updates:</strong> your email address.
          </li>
        </ul>
        <p className="mt-2">
          We also see anonymous, aggregate visit stats (page views, rough
          location, device type) through Vercel Web Analytics, which does not
          use cookies and does not identify you personally.
        </p>
      </section>

      <section>
        <h2>HOW WE USE IT</h2>
        <ul>
          <li>To contact you about the club, events, and opportunities you signed up for.</li>
          <li>To review E-Board applications, DJ sign-ups, and track submissions.</li>
          <li>To plan events (like headcounts from RSVPs).</li>
          <li>To send the weekly update email, if you subscribed.</li>
          <li>To improve the club and the site based on feedback.</li>
        </ul>
        <p className="mt-2">
          Only TMC E-Board members with admin access can see form submissions.
          We don&apos;t sell or rent your information, and we don&apos;t use it
          for advertising.
        </p>
      </section>

      <section>
        <h2>WHERE IT&apos;S STORED</h2>
        <p className="mt-2">We use a few services to run the site:</p>
        <ul>
          <li><strong>Supabase</strong> — stores form submissions and uploaded files.</li>
          <li><strong>Resend</strong> — manages the weekly email list and sends the emails.</li>
          <li><strong>Vercel</strong> — hosts the site and provides cookieless analytics.</li>
        </ul>
        <p className="mt-2">
          Some pages include content from other services — event checkout from
          Posh, music players from Spotify or Apple Music, and links to
          Instagram. Those services have their own privacy policies and may
          set their own cookies when you interact with them.
        </p>
      </section>

      <section>
        <h2>COOKIES</h2>
        <p className="mt-2">
          The public site doesn&apos;t use advertising or tracking cookies. The
          only cookies we set are the ones needed to keep E-Board members
          signed in to the private E-Board area.
        </p>
      </section>

      <section>
        <h2>YOUR CHOICES</h2>
        <ul>
          <li>You can unsubscribe from the weekly email using the link in any email.</li>
          <li>
            You can ask us to update or delete anything you&apos;ve submitted
            — send a request through the <Link href="/feedback">feedback page</Link>{" "}
            (leave your name and email so we can find it) or DM{" "}
            <a href="https://instagram.com/themusiccreativefiu" target="_blank" rel="noreferrer">@themusiccreativefiu</a>.
          </li>
        </ul>
      </section>

      <section>
        <h2>CHANGES</h2>
        <p className="mt-2">
          If we change what we collect or how we use it, we&apos;ll update this
          page and the date at the top.
        </p>
      </section>
    </LegalPage>
  );
}
