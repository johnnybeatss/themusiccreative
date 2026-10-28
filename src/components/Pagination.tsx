import Link from "next/link";
import { PAGE_SIZE } from "@/lib/pagination";

// Numbered page tabs (‹ 1 2 3 ›). Renders nothing when everything fits on
// one page. Long lists collapse to first / current±1 / last with "…" gaps.
export default function Pagination({
  basePath,
  page,
  total,
}: {
  basePath: string;
  page: number;
  total: number;
}) {
  const pageCount = Math.ceil(total / PAGE_SIZE);
  if (pageCount <= 1) return null;

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);
  const shown = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((p) => p >= 1 && p <= pageCount)
    .sort((a, b) => a - b);

  const base = "min-w-9 rounded-lg px-3 py-1.5 text-center text-sm font-semibold transition-colors";
  const idle = `${base} border border-navy-800 text-steel-light hover:border-gold hover:text-ivory`;

  return (
    <nav aria-label="Pages" className="mt-8 flex flex-wrap items-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className={idle} aria-label="Previous page">
          ‹
        </Link>
      )}
      {shown.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && p - shown[i - 1] > 1 && <span className="text-steel-light">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={p === page ? `${base} bg-gold text-ivory` : idle}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className={idle} aria-label="Next page">
          ›
        </Link>
      )}
      <span className="ml-2 text-sm text-steel-light">{total} total</span>
    </nav>
  );
}
