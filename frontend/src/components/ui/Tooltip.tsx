"use client";

import { Tooltip as RadixTooltip } from "radix-ui";
import type { HTMLAttributes, ReactNode } from "react";

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  label: string;
  side?: "top" | "bottom" | "left" | "right";
  children?: ReactNode;
}

/** Short definition on hover/focus. Never the only place a rule is explained — the agent rationale carries the real reasoning. */
export function Tooltip({ label, side = "top", children, ...rest }: TooltipProps) {
  return (
    <RadixTooltip.Provider>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild {...rest}>
          {children}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={8}
            className="z-30 whitespace-nowrap rounded-xs bg-warm-900 py-1.5 px-[9px] font-core text-[13.5px] font-normal leading-[1.5] text-warm-50 shadow-[var(--shadow-3)]"
          >
            {label}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
