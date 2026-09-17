/**
 * Temporary token/theme smoke test for the design-system foundation
 * (context/current-feature.md, Frontend 2b). Replaced wholesale by the real
 * landing page in a later feature — not a permanent route.
 */

const SWATCHES = [
  { label: "brand-primary", className: "bg-brand-primary" },
  { label: "accent-saffron", className: "bg-accent-saffron" },
  { label: "status-danger", className: "bg-status-danger" },
  { label: "status-info", className: "bg-status-info" },
  { label: "warm-100", className: "bg-warm-100" },
  { label: "warm-300", className: "bg-warm-300" },
  { label: "warm-700", className: "bg-warm-700" },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-page p-8">
      <div
        className="mx-auto flex max-w-content-max flex-col gap-6 rounded-lg border border-border-subtle bg-surface-card p-card-pad"
        style={{ boxShadow: "var(--shadow-2)" }}
      >
        <h1>
          Wham design tokens
        </h1>

        <section className="flex flex-wrap gap-4">
          {SWATCHES.map((swatch) => (
            <div key={swatch.label} className="flex flex-col items-center gap-2">
              <span
                className={`h-16 w-16 rounded-md border border-border-subtle ${swatch.className}`}
                aria-hidden="true"
              />
              <span className="wham-mono text-text-muted">{swatch.label}</span>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <p style={{ font: "var(--text-title-m)", color: "var(--text-strong)" }}>
            Title role — text-title-m
          </p>
          <p style={{ font: "var(--text-body-m)", color: "var(--text-body)" }}>
            Body role — text-body-m, resting weight 500 reads slightly confident.
          </p>
          <p className="wham-mono text-text-onchain">
            Settled on Arbitrum &middot; 0x7a3f&hellip;9c21
          </p>
        </section>

        <section>
          <p
            className="wham-tnum"
            style={{ font: "var(--text-money-l)", color: "var(--text-strong)" }}
          >
            $1,111,111.11
          </p>
          <p className="wham-label">tabular numerals, no digit jitter</p>
        </section>

        <p style={{ font: "var(--text-body-s)", color: "var(--text-subtle)" }}>
          Toggle <code className="wham-mono">data-theme=&quot;dark&quot;</code> on{" "}
          <code className="wham-mono">&lt;html&gt;</code> in devtools to check the
          dark scope.
        </p>
      </div>
    </main>
  );
}
