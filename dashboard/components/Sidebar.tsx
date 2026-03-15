"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  {
    label: "FEEDBACK HUB",
    items: [
      {
        href: "/reviews",
        label: "Reviews",
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1.5 3.5h12M1.5 7.5h9M1.5 11.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: "/analytics",
        label: "Analytics",
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M1.5 13.5V9M5.5 13.5V5.5M9.5 13.5V7.5M13.5 13.5V1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
      {
        href: "/suggestions",
        label: "Suggestions",
        icon: (
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5a6 6 0 100 12 6 6 0 000-12zM7.5 5v3.5M7.5 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: "var(--sidebar-width)", borderColor: "var(--border)" }}
      className="fixed left-0 top-0 h-screen flex flex-col bg-white border-r shrink-0 z-40"
    >
      {/* Workspace header */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          PR Assistant
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p
              className="px-2 mb-1 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "var(--text-tertiary)" }}
            >
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      color: isActive ? "var(--accent)" : "var(--text-secondary)",
                      background: isActive ? "var(--accent-light)" : "transparent",
                    }}
                  >
                    <span style={{ color: isActive ? "var(--accent)" : "var(--text-tertiary)" }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

    </aside>
  );
}
