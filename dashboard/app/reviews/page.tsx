import { Suspense } from "react";
import ReviewsTable from "@/components/ReviewsTable";

export const metadata = {
  title: "Reviews | Genie Dashboard",
};

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">PR Reviews</h1>
        <p className="text-gray-400 mt-1 text-sm">
          All Claude PR reviews, most recent first.
        </p>
      </div>
      <Suspense fallback={<TableSkeleton />}>
        <ReviewsTable />
      </Suspense>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-10 bg-gray-800 rounded-lg" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-800/60 rounded-lg" />
      ))}
    </div>
  );
}
