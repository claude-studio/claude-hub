import { Suspense } from "react";
import ReviewsTable from "@/components/ReviewsTable";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reviews | Genie Dashboard",
};

export default function ReviewsPage() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center px-6 py-4 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Reviews
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ background: "var(--surface)" }}>
        <Suspense fallback={<TableSkeleton />}>
          <ReviewsTable />
        </Suspense>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y" style={{ borderColor: "var(--border)" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-6 py-4 space-y-2">
          <div className="h-3 rounded w-32" style={{ background: "var(--border)" }} />
          <div className="h-4 rounded w-64" style={{ background: "var(--border)" }} />
          <div className="h-3 rounded w-full" style={{ background: "var(--border)" }} />
          <div className="flex gap-2">
            <div className="h-5 rounded-full w-20" style={{ background: "var(--border)" }} />
            <div className="h-5 rounded-full w-16" style={{ background: "var(--border)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
