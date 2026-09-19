"use client";

import { ToggleGroup } from "radix-ui";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface SegmentOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "dir"> {
  options: Array<string | SegmentOption>;
  value: string;
  onChange?: (value: string) => void;
  /** Stretch segments to fill the container. */
  full?: boolean;
  size?: "sm" | "md";
}

/** 2–3 short exclusive options shown at once — cadence, currency, calendar range. */
export function SegmentedControl({
  options = [],
  value,
  onChange,
  full = false,
  size = "md",
  className,
  ...rest
}: SegmentedControlProps) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // ToggleGroup's single mode allows deselecting the active item (empty value);
      // a segmented control is always-one-selected, so ignore that case.
      onValueChange={(next) => {
        if (next) onChange?.(next);
      }}
      className={cx(
        "inline-flex gap-[3px] rounded-pill bg-surface-sunken p-[3px]",
        full ? "w-full" : "w-auto",
        className
      )}
      {...rest}
    >
      {options.map((option) => {
        const opt = typeof option === "string" ? { value: option, label: option } : option;
        return (
          <ToggleGroup.Item
            key={opt.value}
            value={opt.value}
            className={cx(
              "cursor-pointer whitespace-nowrap rounded-pill border-0 bg-transparent px-4 font-core font-semibold text-text-muted [transition:var(--transition-control)] data-[state=on]:bg-surface-card data-[state=on]:text-text-strong data-[state=on]:shadow-[var(--shadow-1)]",
              full ? "flex-1" : "flex-none",
              size === "sm" ? "h-[34px] text-[13.5px] leading-[1.2]" : "h-10 text-[15px] leading-[1.2]"
            )}
          >
            {opt.label}
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
