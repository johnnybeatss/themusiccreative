import MerchGrid from "@/components/MerchGrid";

export default function MerchPage() {
  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        MERCH
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        The merch line is still in the works — drops are coming soon. Filter
        by category to see what to expect.
      </p>

      <div className="mt-6">
        <MerchGrid />
      </div>
    </div>
  );
}
