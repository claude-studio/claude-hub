import { Suspense } from "react";
import AnalyticsClient from "@/components/AnalyticsClient";

export const metadata = {
  title: "Analytics | Genie Dashboard",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Review trends, severity distribution, and category breakdowns.
        </p>
      </div>
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsClient />
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-800 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
