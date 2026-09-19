"use client";

import { useState } from "react";
import {
  AuctionCountdown,
  BidRow,
  BidTicket,
  Button,
  CircleCard,
  CollateralMeter,
  ContributionSchedule,
  FillMeter,
  RotationRing,
  StatusChip,
  TierChip,
} from "@/components/ui";

const STATUSES = ["forming", "active", "bidding", "delinquent", "defaulted", "paid out"];

/**
 * Reproduces components/wham/wham.card.html's circle/bidding demo
 * (context/current-feature.md, Frontend 2i).
 */
export function CircleGallery() {
  const [discount, setDiscount] = useState(4.5);
  const [joined, setJoined] = useState(false);

  return (
    <>
      <section className="flex flex-wrap items-center gap-6">
        <RotationRing total={12} completed={4} size={88} label="4/12" sublabel="rounds" />
        <RotationRing total={8} completed={8} current={7} size={56} />
        <RotationRing total={6} completed={2} size={28} />
      </section>

      <section className="flex flex-wrap items-center gap-2.5">
        {STATUSES.map((s) => (
          <StatusChip key={s} status={s} />
        ))}
        <TierChip tier="Starter" />
        <TierChip tier="Standard" />
        <TierChip tier="Trusted" />
      </section>

      <section className="grid gap-3 sm:w-72">
        <FillMeter filled={5} target={8} />
        <FillMeter filled={7} target={8} />
        <FillMeter filled={4} target={10} stalled />
      </section>

      <section className="grid max-w-md gap-3">
        <CircleCard
          name="Tehran Freelancers"
          contribution={200}
          cadence="Monthly"
          members={["Nasrin Amiri", "Reza Karimi", "Leila S"]}
          size={12}
          status="forming"
          tier="Standard"
          depositMultiplier={1.5}
          startDate="in 6 days"
          cta={joined ? { state: "member" } : { state: "join", onClick: () => setJoined(true) }}
        />
      </section>

      <section className="grid gap-2.5">
        <BidRow name="Omid T" discount={6.5} receives={1870} leading />
        <BidRow name="Sara B" discount={4.5} receives={1910} you />
        <BidRow name="Leila S" discount={3} receives={1940} time="2 min ago" />
      </section>

      <section className="grid max-w-md gap-3">
        <BidTicket
          pot={2000}
          discount={discount}
          onDiscountChange={setDiscount}
          footer={<Button full variant="accent">Place bid</Button>}
        />
        <AuctionCountdown endsAt={new Date(Date.now() + 90 * 60 * 1000)} />
        <AuctionCountdown endsAt={new Date(Date.now() + 20 * 60 * 1000)} />
      </section>

      <section className="grid max-w-md gap-3">
        <CollateralMeter deposit={340} potShare={2000} flatRule={600} />
      </section>

      <section className="max-w-lg">
        <ContributionSchedule
          rounds={[
            { round: 1, day: 3, month: "Aug", amount: 200, state: "paid", recipient: "Nasrin Amiri" },
            { round: 2, day: 3, month: "Sep", amount: 1940, state: "payout", note: "Won with a 3% bid" },
            { round: 3, day: 3, month: "Oct", amount: 200, state: "due" },
            { round: 4, day: 3, month: "Nov", amount: 200, state: "overdue" },
            { round: 5, day: 3, month: "Dec", amount: 200, state: "upcoming" },
          ]}
        />
      </section>
    </>
  );
}
