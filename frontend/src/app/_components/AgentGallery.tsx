"use client";

import {
  AgentRationale,
  Button,
  CountdownPill,
  InsurancePoolBar,
  MemberIdentity,
  MemberRotationList,
  ReputationLadder,
  ReputationScore,
  RiskBandChip,
  RiskCallout,
} from "@/components/ui";

const BANDS = ["A", "B", "C", "D"] as const;

/**
 * Reproduces components/wham/wham.card.html's agent/reputation/risk demo
 * (context/current-feature.md, Frontend 2j).
 */
export function AgentGallery() {
  return (
    <>
      <section className="flex flex-wrap items-center gap-4">
        {BANDS.map((b) => (
          <RiskBandChip key={b} band={b} />
        ))}
        <RiskBandChip band="D" expanded />
      </section>

      <section className="flex flex-wrap items-center gap-6">
        <MemberIdentity name="Nasrin Amiri" band="A" score={812} secondary="Joined 6 circles" />
        <MemberIdentity address="0x7a3f9d1c8e2b4a6f0d5c3e9b7a1f2d4c6e8b0a3f" band="C" you linked />
      </section>

      <section className="flex flex-wrap items-center gap-3">
        <CountdownPill endsAt={new Date(Date.now() + 20 * 60 * 1000)} />
        <CountdownPill endsAt={new Date(Date.now() + 5 * 3600 * 1000)} />
        <CountdownPill endsAt={new Date(Date.now() + 3 * 86400000)} />
        <CountdownPill endsAt={new Date(Date.now() + 30 * 86400000)} />
      </section>

      <section className="flex flex-wrap items-start gap-8">
        <ReputationScore score={812} delta={14} circles={6} caption="Score rises with on-time contributions and completed circles." />
        <ReputationLadder current="trusted" className="max-w-sm flex-1" />
      </section>

      <section className="grid max-w-lg gap-3">
        <RiskCallout tone="warning" title="Contribution due in 2 days">
          Round 4&apos;s $200 is due 3 Nov. A missed contribution moves you to delinquent and draws on the insurance pool.
        </RiskCallout>
        <RiskCallout tone="info" title="Deposit sized by the underwriting agent">
          Your $180 deposit reflects Band A history — the standard deposit for this circle is $400.
        </RiskCallout>
        <RiskCallout tone="success" title="Circle completed" action={<Button size="sm">View summary</Button>}>
          All 12 rounds settled with zero defaults. Your reputation score is now 812.
        </RiskCallout>
      </section>

      <section className="grid max-w-md gap-3">
        <InsurancePoolBar balance={3400} target={5000} covers={4} contributionsPerRound={6} />
      </section>

      <section className="max-w-lg">
        <MemberRotationList
          members={[
            { name: "Nasrin Amiri", round: 1, state: "done", received: 1940, month: "Aug" },
            { name: "Reza Karimi", round: 2, state: "current", received: 1910, note: "Took a 4.5% discount" },
            { name: "Sara B", round: 3, state: "upcoming", month: "Oct", you: true },
            { name: "Leila S", round: 4, state: "upcoming", month: "Nov" },
          ]}
        />
      </section>

      <section className="grid max-w-xl gap-3">
        <AgentRationale
          headline="Your deposit is $180, not the standard $400."
          factors={[
            { label: "Wallet age", detail: "Active for 2.4 years", effect: "down", weight: "-$120" },
            { label: "Circle completion history", detail: "6 circles completed, 0 defaults", effect: "down", weight: "-$80" },
            { label: "New chain activity", detail: "First transaction on Arbitrum", effect: "up", weight: "+$20" },
          ]}
          summary="Your on-chain history shows a strong repayment record, so I'm lowering your deposit below the circle standard."
          model="Wham underwriting agent v0.4 · scored 19 Aug 2026"
          txRef="0x9f2a4c7e1b8d3f6a0c5e9b2d7f4a1c8e6b3d0f9a"
        />
      </section>
    </>
  );
}
