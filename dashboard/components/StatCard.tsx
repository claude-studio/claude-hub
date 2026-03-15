export default function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl p-5 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-3xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub ? <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{sub}</p> : null}
    </div>
  );
}
