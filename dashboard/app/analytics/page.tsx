import dynamic from "next/dynamic";

const AnalyticsClient = dynamic(() => import("@/components/AnalyticsClient"), {
  loading: () => <AnalyticsSkeleton />,
});

export const metadata = {
  title: "Analytics | Genie Dashboard",
};

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Analytics
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Review trends, severity distribution, and category breakdowns.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <AnalyticsClient />
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 rounded-xl" style={{ background: "var(--border)" }} />
        ))}
      </div>
    </div>
  );
}
