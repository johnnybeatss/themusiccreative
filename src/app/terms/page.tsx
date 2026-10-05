import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Terms of Use";
const DESCRIPTION =
  "The ground rules for using The Music Creative @ FIU's website, submitting music, and RSVPing to events.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/terms"),
};

export default function TermsPage() {
  return (
    <LegalPage title="TERMS OF USE" updated="October 5, 2026">
      <p>
        These terms cover your use of themusiccreative.org, run by The Music
        Creative @ FIU (&ldquo;TMC,&rdquo; &ldquo;we&rdquo;), a student-led
        organization at Florida International University. By using the site
        you&apos;re agreeing to them.
      </p>

      <section>
        <h2>USING THE SITE</h2>
        <ul>
          <li>Give accurate info when you fill out a form.</li>
          <li>Don&apos;t spam the forms, submit someone else&apos;s info, or try to break or misuse the site.</li>
          <li>The E-Board area is for TMC E-Board members only.</li>
        </ul>
      </section>

      <section>
        <h2>MUSIC YOU SUBMIT</h2>
        <p className="mt-2">
          When you submit a track for the weekly spotlight, you&apos;re
          confirming that you made it or have the rights to share it, and that
          it doesn&apos;t use anyone else&apos;s work without permission.
        </p>
        <p className="mt-2">
          You keep full ownership of your music. By submitting, you give TMC
          permission to play it on this site and to share it on TMC&apos;s
          social accounts to promote the spotlight, with credit to you. If you
          want a track taken down, reach out and we&apos;ll remove it.
        </p>
        <p className="mt-2">
          We pick spotlight tracks at our discretion and may decline or remove
          any submission.
        </p>
      </section>

      <section>
        <h2>EVENTS</h2>
        <p className="mt-2">
          RSVPing helps us plan but doesn&apos;t guarantee entry if space runs
          out. Event details (time, location, guests) can change. Some events
          use Posh for RSVPs or tickets, which has its own terms.
        </p>
      </section>

      <section>
        <h2>OPPORTUNITIES &amp; OUTSIDE LINKS</h2>
        <p className="mt-2">
          We share outside opportunities (contests, internships, gigs) and
          links to other sites as a resource. We don&apos;t run those programs
          and aren&apos;t responsible for them — always check details and
          deadlines with the organizer.
        </p>
      </section>

      <section>
        <h2>CONTENT ON THIS SITE</h2>
        <p className="mt-2">
          The TMC name, logo, photos, and site content belong to TMC or the
          people who made them. Don&apos;t reuse them commercially without
          asking.
        </p>
      </section>

      <section>
        <h2>NO GUARANTEES</h2>
        <p className="mt-2">
          The site is provided as-is. We do our best to keep it accurate and
          working, but can&apos;t promise it always will be.
        </p>
      </section>

      <section>
        <h2>CHANGES &amp; QUESTIONS</h2>
        <p className="mt-2">
          We may update these terms and will change the date at the top when
          we do. Questions? Use the <Link href="/feedback">feedback page</Link>{" "}
          or DM <a href="https://instagram.com/themusiccreativefiu" target="_blank" rel="noreferrer">@themusiccreativefiu</a>.
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
