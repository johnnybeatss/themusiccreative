"use client";

import Image from "next/image";
import Reveal from "@/components/Reveal";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((m, i) => (
        <Reveal key={m.id} delay={i * 0.05}>
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold">
            <div className="aspect-[3/4] w-full bg-navy-950">
              {m.photo_url ? (
                // unoptimized: see TeamGrid/TeamTabs history — the Next.js
                // image optimizer intermittently served stale/unrelated
                // cached content for these paths; bypassing it serves the
                // raw file directly.
                <Image
                  src={m.photo_url}
                  alt={m.name}
                  width={800}
                  height={1214}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="font-display text-4xl text-steel-light">
                    {m.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="font-display text-xl tracking-wide text-ivory">
                {m.name}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">
                {m.role}
              </p>
              {m.bio && (
                <p className="mt-3 text-sm leading-relaxed text-ivory">
                  {m.bio}
                </p>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
