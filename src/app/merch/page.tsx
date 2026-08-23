import type { Metadata } from "next";
import { Instagram } from "lucide-react";
import CharmScatter from "@/components/CharmScatter";
import { pageOpenGraph } from "@/lib/pageMetadata";

const TITLE = "Merch";
const DESCRIPTION =
  "The Music Creative @ FIU merch line — drops coming soon. Follow @themusiccreativefiu to be first to know.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: "/merch",
  },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/merch"),
};

const INSTAGRAM_URL = "https://instagram.com/themusiccreativefiu";

export default function MerchPage() {
  return (
    <div className="relative">
      <CharmScatter
        items={[
          { name: "cd", className: "right-[4%] top-0 w-16 rotate-12" },
          {
            name: "guitar-les-paul",
            className: "left-[2%] bottom-0 w-14 -rotate-6",
          },
        ]}
      />
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        MERCH
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        The merch line is still in the works — drops are coming soon.
        Follow us on Instagram to be the first to know when it goes live.
      </p>

      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-gold transition-colors hover:bg-gold hover:text-navy-950"
      >
        <Instagram size={18} />
        Follow @themusiccreativefiu
      </a>
    </div>
  );
}
