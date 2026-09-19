"use client";

import { useState } from "react";
import {
  Avatar,
  Badge,
  ListRow,
  MoneyAmount,
  OnChainRef,
  ProgressBar,
  StatTile,
  Table,
} from "@/components/ui";

interface Round {
  id: number;
  member: string;
  amount: number;
  status: "paid" | "due";
}

const ROUNDS: Round[] = [
  { id: 1, member: "Nasrin Amiri", amount: 200, status: "paid" },
  { id: 2, member: "Reza Karimi", amount: 200, status: "paid" },
  { id: 3, member: "Leila S", amount: 200, status: "due" },
];

/**
 * Reproduces components/data/data.card.html's demo
 * (context/current-feature.md, Frontend 2h).
 */
export function DataGallery() {
  const [clicked, setClicked] = useState<string | null>(null);

  return (
    <>
      <section className="flex flex-wrap items-end gap-6">
        <MoneyAmount value={950} role="hero" />
        <MoneyAmount value={200} role="primary" unit="USDC" />
        <MoneyAmount value={42.5} role="ledger" decimals={2} />
        <MoneyAmount value={18} sign tone="positive" />
        <MoneyAmount value={-6} sign tone="negative" />
        <MoneyAmount value={1000} strikethrough muted />
      </section>

      <section className="flex flex-wrap items-center gap-2.5">
        <OnChainRef value="0x7a3f4b8c9d1e2f3a4b5c6d7e8f9a0b1c2d3e4f56" label="Contract" />
        <OnChainRef value="0x9c21f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7" chain="Arbitrum" href="#" copyable={false} />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pot size" value={<MoneyAmount value={2400} role="inline" />} sub="12 members" icon="wallet" />
        <StatTile label="Rounds left" value="4 of 12" tone="brand" />
        <StatTile label="Agent risk" value="Low" tone="agent" icon="shield-check" align="center" />
        <StatTile label="Insurance draw" value="0" tone="danger" sub="No claims this round" />
      </section>

      <section className="flex flex-col gap-3 sm:w-80">
        <ProgressBar value={4} max={12} label="Rounds completed" caption="4 of 12" />
        <ProgressBar value={80} tone="accent" height={6} />
        <ProgressBar value={35} tone="danger" caption="35%" />
      </section>

      <section className="flex flex-col">
        {ROUNDS.map((r) => (
          <ListRow
            key={r.id}
            leading={<Avatar name={r.member} size="sm" />}
            title={r.member}
            subtitle={`Round ${r.id}`}
            trailing={<Badge tone={r.status === "paid" ? "success" : "warning"}>{r.status === "paid" ? "Paid" : "Due"}</Badge>}
            onClick={() => setClicked(r.member)}
          />
        ))}
        {clicked ? (
          <p className="pt-2 text-text-subtle" style={{ font: "var(--text-body-s)" }}>
            Last clicked: {clicked}
          </p>
        ) : null}
      </section>

      <Table
        columns={[
          { key: "member", header: "Member" },
          { key: "amount", header: "Amount", align: "right", cell: (row: Round) => <MoneyAmount value={row.amount} role="ledger" /> },
          {
            key: "status",
            header: "Status",
            cell: (row: Round) => <Badge tone={row.status === "paid" ? "success" : "warning"}>{row.status}</Badge>,
          },
        ]}
        rows={ROUNDS}
        onRowClick={(row) => setClicked(row.member)}
      />
    </>
  );
}
