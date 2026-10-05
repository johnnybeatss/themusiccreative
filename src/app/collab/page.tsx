import type { Metadata } from "next";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { pageOpenGraph } from "@/lib/pageMetadata";
import Reveal from "@/components/Reveal";
import { COLLAB_ROLES, type CollabPost, type CollabRole } from "@/lib/collab";
import CollabForm from "./CollabForm";

const TITLE = "Collab Board";
const DESCRIPTION =
  "Producers, artists, songwriters, and DJs at FIU looking to work together.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/collab" },
  ...pageOpenGraph(TITLE, DESCRIPTION, "/collab"),
};

// RLS already limits the public to approved posts from the last 30 days.
async function getPosts(): Promise<CollabPost[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collab_posts")
    .select("*")
    .not("approved_at", "is", null)
    .order("approved_at", { ascending: false });
  if (error) {
    console.error("Failed to load collab posts:", error.message);
    return [];
  }
  return (data ?? []) as CollabPost[];
}

export default async function CollabPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const active = COLLAB_ROLES.includes(role as CollabRole) ? (role as CollabRole) : null;
  const all = await getPosts();
  const posts = active ? all.filter((p) => p.role === active) : all;

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-semibold ${
      on ? "border-gold bg-gold text-white" : "border-navy-800 text-steel-light hover:border-gold"
    }`;

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">COLLAB BOARD</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 max-w-2xl text-sm text-steel-light">
        Find people to make music with. Posts are reviewed by E-Board and stay up
        for 30 days. Reach out through Instagram.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/collab" className={chip(!active)}>
          All
        </Link>
        {COLLAB_ROLES.map((r) => (
          <Link key={r} href={`/collab?role=${r}`} className={chip(active === r)}>
            {r}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="mt-6 text-steel-light">Nothing here yet — be the first to post.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.04} className="h-full">
              <div className="flex h-full flex-col rounded-xl border border-navy-800 bg-navy-900 p-4">
                <span className="w-fit rounded-full border border-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  {p.role}
                </span>
                <p className="mt-2 font-semibold text-ivory">{p.looking_for}</p>
                <p className="text-sm text-steel-light">{p.name}</p>
                {p.details && <p className="mt-2 flex-1 whitespace-pre-line text-sm text-steel-light">{p.details}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a
                    href={p.instagram_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-light"
                  >
                    <Instagram size={12} /> DM
                  </a>
                  {p.sample_url && (
                    <a
                      href={p.sample_url}
                      target="_blank"
                      rel="noreferrer nofollow ugc"
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      Hear their work &rarr;
                    </a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      <div className="mt-12 max-w-2xl">
        <CollabForm />
      </div>
    </div>
  );
}
