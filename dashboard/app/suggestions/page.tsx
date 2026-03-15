import { Suspense } from "react";
import SuggestionsClient from "@/components/SuggestionsClient";

export const metadata = {
  title: "Suggestions | Genie Dashboard",
};

export default function SuggestionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rule Suggestions</h1>
        <p className="text-gray-400 mt-1 text-sm">
          Review patterns Claude identified. Adopt or dismiss suggestions to improve review quality.
        </p>
      </div>
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-800 rounded-xl" />}>
        <SuggestionsClient />
      </Suspense>
    </div>
  );
}
