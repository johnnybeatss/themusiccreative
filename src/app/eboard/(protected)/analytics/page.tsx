import { getEffectiveRole, isOwner } from "@/lib/supabase/role";
import { getAnalyticsConfigStatus, getSiteAnalytics } from "@/lib/vercelAnalytics";

const WINDOW_DAYS = 30;

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function formatDay(timestamp: string | undefined): string {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel-light">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-gold">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-xs text-steel-light">Last {WINDOW_DAYS} days</p>
    </div>
  );
}

function DailyTrendChart({
  rows,
}: {
  rows: { timestamp?: string; pageviews: number; visitors: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.pageviews));
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel-light">
        Page Views by Day
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-steel-light">No data yet.</p>
      ) : (
        <div className="mt-4 flex h-40 items-end gap-1">
          {rows.map((r, i) => (
            <div
              key={r.timestamp ?? i}
              // h-full gives this column a definite height (matching the
              // h-40 container) for the bar's percentage height below to
              // resolve against — without it, the column's height is "auto"
              // (shrink-to-fit an empty box), so a percentage height on the
              // bar has nothing to measure against and silently computes to
              // 0. That's why the chart looked empty even with real data.
              className="group relative h-full flex-1"
              title={`${formatDay(r.timestamp)}: ${formatNumber(r.pageviews)} views, ${formatNumber(r.visitors)} visitors`}
            >
              <div
                className="absolute inset-x-0 bottom-0 rounded-t bg-gold/70 transition-colors group-hover:bg-gold"
                style={{ height: `${Math.max(2, (r.pageviews / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <div className="mt-2 flex justify-between text-[10px] text-steel-light">
          <span>{formatDay(rows[0]?.timestamp)}</span>
          <span>{formatDay(rows[rows.length - 1]?.timestamp)}</span>
        </div>
      )}
    </div>
  );
}

function RankedTable({
  title,
  rows,
  labelKey,
  emptyText,
}: {
  title: string;
  rows: Record<string, unknown>[];
  labelKey: string;
  emptyText: string;
}) {
  const max = Math.max(1, ...rows.map((r) => Number(r.pageviews) || 0));
  return (
    <div className="rounded-xl border border-navy-800 bg-navy-900 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel-light">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-steel-light">{emptyText}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r, i) => {
            const label = (r[labelKey] as string) || "(direct / unknown)";
            const pageviews = Number(r.pageviews) || 0;
            return (
              <li key={`${label}-${i}`}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ivory">{label}</span>
                  <span className="shrink-0 text-steel-light">
                    {formatNumber(pageviews)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-navy-800">
                  <div
                    className="h-1.5 rounded-full bg-gold"
                    style={{ width: `${Math.max(3, (pageviews / max) * 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default async function AnalyticsPage() {
  const role = await getEffectiveRole();

  if (!isOwner(role)) {
    return (
      <div>
        <h1 className="font-display text-3xl tracking-wide text-ivory">
          ANALYTICS
        </h1>
        <div className="mt-2 h-1 w-16 bg-gold" />
        <p className="mt-6 text-steel-light">
          Site analytics are restricted to the owner account.
        </p>
      </div>
    );
  }

  const configStatus = getAnalyticsConfigStatus();

  return (
    <div>
      <h1 className="font-display text-3xl tracking-wide text-ivory">
        ANALYTICS
      </h1>
      <div className="mt-2 h-1 w-16 bg-gold" />
      <p className="mt-4 text-sm text-steel-light">
        Website traffic from Vercel Web Analytics — visible to the owner
        account only.
      </p>

      {!configStatus.configured ? (
        <div className="mt-6 rounded-xl border border-gold/50 bg-navy-900 p-5">
          <p className="font-semibold text-ivory">Not set up yet</p>
          <p className="mt-2 text-sm text-steel-light">
            Missing env var{configStatus.missing.length > 1 ? "s" : ""}:{" "}
            <span className="font-mono text-gold">
              {configStatus.missing.join(", ")}
            </span>
            . Add {configStatus.missing.length > 1 ? "these" : "this"} to{" "}
            <span className="font-mono">.env.local</span> and to Vercel &rsaquo;
            Project Settings &rsaquo; Environment Variables, then redeploy.
          </p>
        </div>
      ) : (
        <AnalyticsData />
      )}
    </div>
  );
}

async function AnalyticsData() {
  const result = await getSiteAnalytics();

  if (!result.ok) {
    return (
      <div className="mt-6 rounded-xl border border-navy-800 bg-navy-900 p-5">
        <p className="font-semibold text-ivory">Couldn&apos;t load analytics</p>
        <p className="mt-2 text-sm text-steel-light">{result.error}</p>
        <p className="mt-2 text-xs text-steel-light">
          Double-check the token, project ID, and (if the project is under a
          Vercel Team) the team ID/slug — and that Web Analytics is enabled
          for this project in Vercel &rsaquo; Project Settings &rsaquo;
          Analytics.
        </p>
      </div>
    );
  }

  const { totals, daily, topPages, topReferrers, devices } = result.data;

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard label="Page Views" value={totals.pageviews} />
        <SummaryCard label="Unique Visitors" value={totals.visitors} />
      </div>

      <DailyTrendChart rows={daily} />

      <div className="grid gap-4 sm:grid-cols-2">
        <RankedTable
          title="Top Pages"
          rows={topPages}
          labelKey="route"
          emptyText="No page view data yet."
        />
        <RankedTable
          title="Top Referrers"
          rows={topReferrers}
          labelKey="referrerHostname"
          emptyText="No referrer data yet."
        />
      </div>

      <RankedTable
        title="Devices"
        rows={devices}
        labelKey="deviceType"
        emptyText="No device data yet."
      />
    </div>
  );
}
