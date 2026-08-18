const STYLES: Record<string, string> = {
  "Not started": "border-steel text-steel-light",
  "In progress": "border-gold text-gold",
  Done: "border-ivory/40 text-ivory",
};

export default function StatusPill({ status }: { status: string }) {
  const style = STYLES[status] ?? "border-steel text-steel-light";
  return (
    <span
      className={`inline-block shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${style}`}
    >
      {status}
    </span>
  );
}
