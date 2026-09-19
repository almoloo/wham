"use client";

import { useState } from "react";
import { Banner, Button, Dialog, EmptyState, Icon, Spinner, Toast, Tooltip } from "@/components/ui";

/**
 * Reproduces components/feedback/feedback.card.html's demo
 * (context/current-feature.md, Frontend 2f).
 */
export function FeedbackGallery() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="flex flex-wrap items-center gap-2.5">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open confirmation sheet
        </Button>
        <Tooltip label="Shared buffer that covers a missed contribution">
          <span className="inline-flex items-center gap-1.5 font-core text-[13.5px] font-semibold leading-[1.2] text-text-muted">
            Insurance pool <Icon name="info" size={15} />
          </span>
        </Tooltip>
      </section>

      <Toast tone="success" title="Bid placed" detail="4% · closes 3 Sep, 18:00" action="View" />
      <Toast tone="danger" title="Contribution didn't go through" detail="Retry by 5 Sep to avoid a reputation hit" />

      <Banner tone="warning" title="Your collateral dropped below 80%" body="Top up before the next round to keep bidding." action="Top up" />

      <section className="flex flex-wrap items-center gap-2.5">
        <Spinner />
        <Spinner size="sm" label="Placing bid…" />
      </section>

      <div className="relative min-h-[210px] overflow-hidden rounded-lg border border-border-subtle">
        <EmptyState
          icon="users"
          title="No circles yet"
          body="Browse open circles or start one with people you know."
          action={<Button>Browse circles</Button>}
        />
      </div>

      <Dialog
        open={open}
        sheet
        title="Place a 4% bid?"
        description="You'll receive $1,920 instead of $2,000 if you win this round."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" full onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" full onClick={() => setOpen(false)}>
              Place bid
            </Button>
          </>
        }
      />
    </>
  );
}
