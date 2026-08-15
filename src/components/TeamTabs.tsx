"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photo_url: string | null;
};

export default function TeamTabs({ members }: { members: TeamMember[] }) {
  const [activeId, setActiveId] = useState(members[0]?.id);
  const active = members.find((m) => m.id === activeId) ?? members[0];

  if (!active) return null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setActiveId(m.id)}
            data-active={m.id === active.id}
            className="rounded-full border border-navy-800 px-4 py-1.5 text-sm font-semibold text-steel-light transition-colors hover:border-gold hover:text-gold data-[active=true]:border-gold data-[active=true]:bg-gold data-[active=true]:text-navy-950"
          >
            {m.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-6 grid gap-6 sm:grid-cols-[220px_1fr] sm:items-start"
        >
          <div className="aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl border border-navy-800 bg-navy-900">
            {active.photo_url ? (
              // unoptimized: Next's built-in image optimizer was
              // intermittently serving unrelated cached content for this
              // path instead of the actual file (confirmed via direct
              // network/pixel inspection — the raw file itself always
              // loads correctly). Bypassing the optimizer serves the file
              // directly and sidesteps whatever's going wrong there.
              <Image
                src={active.photo_url}
                alt={active.name}
                width={800}
                height={1214}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-4xl text-steel-light">
                  {active.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-display text-2xl tracking-wide text-ivory">
              {active.name}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-gold">
              {active.role}
            </p>
            {active.bio && (
              <p className="mt-4 text-sm leading-relaxed text-ivory">
                {active.bio}
              </p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
