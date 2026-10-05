import type { ReactNode } from "react";

// Shared layout for /privacy and /terms — plain readable prose, same
// heading treatment as the rest of the site.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-2xl">
      <h1 className="font-display text-3xl tracking-wide text-ivory">{title}</h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-xs uppercase tracking-wide text-steel-light">
        Last updated {updated}
      </p>
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-steel-light [&_a]:text-accent [&_a]:underline [&_h2]:font-display [&_h2]:text-lg [&_h2]:tracking-wide [&_h2]:text-ivory [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ivory [&_ul]:mt-2 [&_ul]:space-y-1">
        {children}
      </div>
    </article>
  );
}
