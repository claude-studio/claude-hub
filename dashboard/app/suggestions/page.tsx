import { Suspense } from "react";
import SuggestionsClient from "@/components/SuggestionsClient";

export const metadata = {
  title: "Suggestions | Genie Dashboard",
};

export default function SuggestionsPage() {
  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Suggestions
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Patterns Claude identified. Adopt or dismiss to improve review quality.
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <Suspense fallback={<div className="animate-pulse h-64 rounded-xl" style={{ background: "var(--border)" }} />}>
          <SuggestionsClient />
        </Suspense>
      </div>
    </div>
  );
}
