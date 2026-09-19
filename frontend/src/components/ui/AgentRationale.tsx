"use client";

import { useState, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";
import { OnChainRef } from "./OnChainRef";

export interface RationaleFactor {
  /** What the agent looked at, in plain words. */
  label: string;
  /** How it moved the number. */
  detail?: string;
  /** up = raised the deposit, down = lowered it, flat = no effect. */
  effect?: "up" | "down" | "flat";
  /** Contribution weight, shown in mono, e.g. "+$40". */
  weight?: string;
}

const EFFECT: Record<NonNullable<RationaleFactor["effect"]>, { icon: IconName; color: string }> = {
  up: { icon: "arrow-up-right", color: "var(--status-danger)" },
  down: { icon: "arrow-down-right", color: "var(--status-success)" },
  flat: { icon: "minus", color: "var(--text-subtle)" },
};

export interface AgentRationaleProps extends HTMLAttributes<HTMLDivElement> {
  /** The decision, stated as a fact — e.g. "Your deposit is $180, not the standard $400." */
  headline: string;
  factors: RationaleFactor[];
  /** Closing paragraph in the agent's first-person voice. */
  summary?: string;
  /** Model + version line, e.g. "Wham underwriting agent v0.4 · scored 19 Aug 2026". */
  model?: string;
  /** Hash of the on-chain decision record. */
  txRef?: string;
  defaultOpen?: boolean;
}

/**
 * The agent transparency surface: the reasoning behind a collateral decision,
 * factor by factor. Lapis is reserved for this and for on-chain receipts.
 */
export function AgentRationale({
  headline,
  factors,
  summary,
  model,
  txRef,
  defaultOpen = true,
  className,
  ...rest
}: AgentRationaleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cx("grid grid-cols-[minmax(0,1fr)] gap-3.5 rounded-lg border border-lapis-100 bg-surface-agent p-card-pad", className)}
      {...rest}
    >
      <div className="flex items-start gap-2.5">
        <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-pill bg-lapis-100">
          <Icon name="sparkles" size={16} color="var(--lapis-500)" />
        </span>
        <div className="grid flex-1 gap-[3px]">
          <span
            className="uppercase text-status-info-text"
            style={{ font: "var(--text-label)", letterSpacing: "var(--tracking-label)" }}
          >
            Underwriting agent
          </span>
          <span className="text-text-strong" style={{ font: "var(--text-title-s)" }}>
            {headline}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-status-info-text"
          style={{ font: "var(--text-ui-s)" }}
        >
          {open ? "Hide" : "Show"} reasoning
          <Icon name={open ? "chevron-up" : "chevron-down"} size={15} />
        </button>
      </div>

      {open ? (
        <div className="grid gap-2">
          {factors.map((f, i) => {
            const e = EFFECT[f.effect ?? "flat"];
            return (
              <div key={i} className="flex items-start gap-2.5 rounded-md bg-surface-card px-3.5 py-[11px]">
                <Icon name={e.icon} size={16} color={e.color} className="mt-0.5" />
                <div className="grid flex-1 gap-0.5">
                  <span className="text-text-strong" style={{ font: "var(--text-ui-s)" }}>
                    {f.label}
                  </span>
                  {f.detail ? (
                    <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
                      {f.detail}
                    </span>
                  ) : null}
                </div>
                {f.weight ? <span className="wham-mono whitespace-nowrap">{f.weight}</span> : null}
              </div>
            );
          })}
          {summary ? (
            <p className="max-w-[52ch] text-text-body" style={{ font: "var(--text-body-m)" }}>
              {summary}
            </p>
          ) : null}
          {model || txRef ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {model ? (
                <span className="text-text-subtle" style={{ font: "var(--text-body-s)" }}>
                  {model}
                </span>
              ) : null}
              {txRef ? <OnChainRef label="Decision record" value={txRef} /> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

