"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";

const CATEGORIES = [
  "Shirts",
  "Hoodies",
  "Hats",
  "Bags",
  "Accessories",
] as const;
type Category = (typeof CATEGORIES)[number];

type MerchItem = {
  id: string;
  category: Category;
  gradient: string;
};

// Cosmetic-only gradient variants so the placeholder grid doesn't look like
// one tile repeated — no real product photos exist yet, so these are
// abstract blurred blocks standing in until real merch photos replace them.
// (Each string is a complete, literal Tailwind class chunk — required so
// Tailwind's build-time scanner can actually find and generate them.)
const GRADIENTS = [
  "from-navy-700 via-gold/20 to-navy-950",
  "from-gold/25 via-navy-800 to-navy-950",
  "from-steel via-navy-900 to-navy-950",
  "from-navy-800 via-steel/40 to-navy-950",
  "from-gold/15 via-navy-700 to-abyss",
];

// Three placeholder tiles per category — swap a tile's content for a real
// product (photo, name, price, link) once merch actually exists; the grid
// and filter logic don't need to change.
const ITEMS: MerchItem[] = CATEGORIES.flatMap((category, ci) =>
  Array.from({ length: 3 }, (_, i) => ({
    id: `${category}-${i}`,
    category,
    gradient: GRADIENTS[(ci + i) % GRADIENTS.length],
  }))
);

export default function MerchGrid() {
  const [filter, setFilter] = useState<Category | "All">("All");

  const filtered =
    filter === "All"
      ? ITEMS
      : ITEMS.filter((item) => item.category === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            data-active={filter === c}
            className="rounded-full border border-navy-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-steel-light transition-colors hover:border-gold hover:text-gold data-[active=true]:border-gold data-[active=true]:bg-gold data-[active=true]:text-navy-950"
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-navy-800 transition-colors hover:border-gold"
            >
              <div
                className={`absolute -inset-6 bg-gradient-to-br ${item.gradient} blur-2xl`}
              />
              <div className="absolute inset-0 bg-navy-950/45" />
              <div className="relative flex h-full flex-col items-center justify-center gap-2 text-center">
                <Lock size={20} className="text-gold" />
                <p className="font-display text-sm tracking-wide text-ivory">
                  COMING SOON
                </p>
                <span className="rounded-full border border-navy-700 bg-navy-950/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-steel-light">
                  {item.category}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
