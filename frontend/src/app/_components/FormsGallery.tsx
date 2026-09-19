"use client";

import { useState } from "react";
import { Checkbox, Input, RadioGroup, RadioGroupItem, Select, Switch, Textarea } from "@/components/ui";

/**
 * Reproduces components/forms/forms.card.html's demo, adapted for the
 * RadioGroup/RadioGroupItem API (context/current-feature.md, Frontend 2e,
 * Decision 2). Interactive, so it's the one client leaf on this page.
 */
export function FormsGallery() {
  const [amount, setAmount] = useState("200");
  const [cadence, setCadence] = useState("Monthly");
  const [ok, setOk] = useState(true);
  const [order, setOrder] = useState("auction");
  const [autopay, setAutopay] = useState(true);

  return (
    <>
      <section className="grid grid-cols-2 gap-3.5">
        <Input
          label="Contribution per round"
          prefix="$"
          suffix="USDC"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          hint="Every member pays this, every round."
        />
        <Select
          label="Round length"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
          options={["Weekly", "Fortnightly", "Monthly"]}
        />
        <Input label="Invite code" mono iconLeft="link-2" defaultValue="WHAM-8F2K" />
        <Input label="Wallet address" mono defaultValue="0x" error="Enter a valid Arbitrum address." />
      </section>

      <RadioGroup value={order} onValueChange={setOrder} name="order">
        <RadioGroupItem value="auction" label="Bid for my turn" description="Take the pot early by accepting a discount." />
        <RadioGroupItem value="fixed" label="Keep my scheduled turn" description="Receive the full pot in round 7." />
      </RadioGroup>

      <Checkbox
        checked={ok}
        onChange={setOk}
        label="I understand my deposit is locked for 12 rounds"
        description="Released when the circle completes, or forfeited if I miss two contributions."
      />

      <Switch
        checked={autopay}
        onChange={setAutopay}
        label="Auto-pay contributions"
        description="Charged from your wallet 24h before each due date."
      />

      <Textarea label="Reason for dispute" hint="Shared with the circle's other members" rows={3} />
    </>
  );
}
