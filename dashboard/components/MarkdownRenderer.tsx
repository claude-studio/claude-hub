"use client";

import ReactMarkdown from "react-markdown";

const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-xl font-bold mt-6 mb-3" style={{ color: "var(--text-primary)" }}>
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-base font-semibold mt-5 mb-2" style={{ color: "var(--text-primary)" }}>
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold mt-4 mb-1.5" style={{ color: "var(--text-primary)" }}>
      {children}
    </h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
      {children}
    </p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-sm space-y-1 mb-3 pl-5 list-disc" style={{ color: "var(--text-secondary)" }}>
      {children}
    </ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="text-sm space-y-1 mb-3 pl-5 list-decimal" style={{ color: "var(--text-secondary)" }}>
      {children}
    </ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
    inline ? (
      <code
        className="text-xs px-1.5 py-0.5 rounded font-mono"
        style={{ background: "var(--surface-secondary)", color: "var(--accent)", border: "1px solid var(--border)" }}
      >
        {children}
      </code>
    ) : (
      <code>{children}</code>
    ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre
      className="text-xs rounded-xl p-4 overflow-x-auto mb-3 font-mono leading-relaxed border"
      style={{ background: "var(--surface-secondary)", color: "var(--text-secondary)", borderColor: "var(--border)" }}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      className="pl-4 my-3 text-sm italic"
      style={{ borderLeft: "3px solid var(--accent)", color: "var(--text-tertiary)" }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-4" style={{ borderColor: "var(--border)" }} />
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>
      {children}
    </strong>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 transition-opacity hover:opacity-70"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </a>
  ),
};

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  );
}
