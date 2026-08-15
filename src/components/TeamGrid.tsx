"use client";

import Image from "next/image";
import { Instagram, Linkedin } from "lucide-react";
import Reveal from "@/components/Reveal";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
};

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  return (
    <div className="flex flex-col gap-6">
      {members.map((m, i) => (
        <Reveal key={m.id} delay={i * 0.05}>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-navy-800 bg-navy-900 transition-colors hover:border-gold sm:flex-row">
            <div className="aspect-[3/4] w-full shrink-0 bg-navy-950 sm:w-56">
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
            <div className="flex flex-1 flex-col justify-center p-6">
              <p className="font-display text-xl tracking-wide text-ivory">
                {m.name}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gold">
                {m.role}
              </p>
              {(m.instagram_url || m.linkedin_url) && (
                <div className="mt-2 flex items-center gap-3">
                  {m.instagram_url && (
                    <a
                      href={m.instagram_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${m.name} on Instagram`}
                      className="text-steel-light transition-colors hover:text-gold"
                    >
                      <Instagram size={16} />
                    </a>
                  )}
                  {m.linkedin_url && (
                    <a
                      href={m.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${m.name} on LinkedIn`}
                      className="text-steel-light transition-colors hover:text-gold"
                    >
                      <Linkedin size={16} />
                    </a>
                  )}
                </div>
              )}
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
