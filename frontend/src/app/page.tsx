/**
 * Temporary token/theme smoke test for the design-system foundation
 * (context/current-feature.md, Frontend 2b/2d). Replaced wholesale by the
 * real landing page in a later feature — not a permanent route.
 */

import {
  Avatar,
  AvatarStack,
  Badge,
  Button,
  Card,
  Divider,
  Icon,
  IconButton,
  SectionHeader,
  Skeleton,
  Tag,
} from "@/components/ui";

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

      <div
        className="mx-auto mt-6 flex max-w-content-max flex-col gap-6 rounded-lg border border-border-subtle bg-surface-card p-card-pad"
        style={{ boxShadow: "var(--shadow-2)" }}
      >
        <h2>Core components</h2>

        <section className="flex flex-wrap items-center gap-2.5">
          <Button>Join circle</Button>
          <Button variant="accent" iconLeft="wallet">
            Pay $200
          </Button>
          <Button variant="secondary">Details</Button>
          <Button variant="ghost" iconLeft="info">
            Why?
          </Button>
          <Button variant="danger" size="sm">
            Leave
          </Button>
          <Button disabled>Bid closed</Button>
          <IconButton icon="chevron-left" label="Back" variant="outline" />
          <IconButton icon="plus" label="New circle" variant="primary" />
        </section>

        <section className="flex flex-wrap items-center gap-2.5">
          <Badge tone="success" dot>
            Paid
          </Badge>
          <Badge tone="warning" dot>
            Due 3 Sep
          </Badge>
          <Badge tone="danger" icon="alert-triangle">
            Overdue 2 days
          </Badge>
          <Badge tone="info" icon="link-2">
            On-chain
          </Badge>
          <Badge tone="brand">Round 4</Badge>
          <Tag icon="users">12 members</Tag>
          <Tag icon="refresh-cw">Monthly</Tag>
          <Tag mono selected>
            Arbitrum
          </Tag>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Card padding="compact" interactive>
            <SectionHeader
              title="Tehran Freelancers"
              caption="$200 · monthly · 12 rounds"
              action="Open"
            />
          </Card>
          <Card padding="compact" tone="sunken" className="grid gap-2">
            <Skeleton width={140} height={16} />
            <Skeleton width="80%" height={12} />
          </Card>
        </section>

        <section className="flex flex-wrap items-center gap-2.5">
          <Avatar name="Nasrin Amiri" size="lg" band="trusted" />
          <Avatar name="Reza Karimi" band="solid" />
          <Avatar name="Leila S" size="sm" band="building" />
          <AvatarStack
            members={["Nasrin Amiri", "Reza Karimi", "Leila S", "Omid T", "Sara B"]}
            total={12}
            max={4}
          />
          <Icon name="shield-check" size={24} color="var(--brand-primary)" />
          <Icon name="gavel" size={24} color="var(--accent-saffron)" />
          <Icon name="sparkles" size={24} color="var(--lapis-500)" />
        </section>

        <Divider label="Or continue with" />

        <section className="flex items-center gap-2.5">
          <span>Circles</span>
          <Divider vertical className="h-4" />
          <span>Browse</span>
          <Divider vertical className="h-4" />
          <span>Calendar</span>
        </section>
      </div>
    </main>
  );
}
