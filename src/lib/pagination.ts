// Shared paging for the E-Board submission lists (?page=N, 1-based).

export const PAGE_SIZE = 20;

export function parsePage(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

// Inclusive [from, to] for Supabase .range().
export function pageRange(page: number): [number, number] {
  const from = (page - 1) * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1];
}

// Last valid page for `total` rows (1 when empty).
export function lastPage(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}
