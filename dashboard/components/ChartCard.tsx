import type { ReactNode } from "react";

export default function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{title}</h3>
      {children}
    </div>
  );
}
