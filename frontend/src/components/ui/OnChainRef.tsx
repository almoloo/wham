"use client";

import { useState, type HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

function truncate(value: string, head: number, tail: number) {
  const s = String(value ?? "");
  if (s.length <= head + tail + 1) return s;
  return s.slice(0, head) + "…" + s.slice(-tail);
}

export interface OnChainRefProps extends HTMLAttributes<HTMLSpanElement> {
  /** Full address or hash; displayed truncated as 0x1234…abcd. */
  value: string;
  /** Small caps label, e.g. "CONTRACT" or "SETTLEMENT TX". */
  label?: string;
  /** Chain name shown after the value. Default "Arbitrum". */
  chain?: string;
  /** Block-explorer link. */
  href?: string;
  copyable?: boolean;
}

/** Truncated address / tx hash with chain provenance. On-chain proof is a receipt: mono, lapis, subordinate. */
export function OnChainRef({
  value,
  label,
  chain = "Arbitrum",
  href,
  copyable = true,
  className,
  ...rest
}: OnChainRefProps) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center gap-2 rounded-xs bg-surface-agent px-2.5 py-[5px]",
        className
      )}
      {...rest}
    >
      <Icon name="link-2" size={14} color="var(--status-info)" />
      {label ? (
        <span
          className="uppercase text-status-info-text"
          style={{ font: "var(--text-label)", letterSpacing: "var(--tracking-label)" }}
        >
          {label}
        </span>
      ) : null}
      {href ? (
        <a href={href} className="wham-mono text-text-onchain no-underline">
          {truncate(value, 6, 4)}
        </a>
      ) : (
        <span className="wham-mono text-text-onchain">{truncate(value, 6, 4)}</span>
      )}
      <span className="text-text-subtle" style={{ font: "var(--text-body-s)" }}>
        {chain}
      </span>
      {copyable ? (
        <button
          type="button"
          onClick={copy}
          aria-label="Copy"
          className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-status-info-text"
        >
          <Icon name={copied ? "check" : "copy"} size={14} />
        </button>
      ) : null}
    </span>
  );
}
