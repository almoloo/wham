"use client";

import { RadioGroup as RadixRadioGroup } from "radix-ui";
import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

/** A single mutually-exclusive choice, e.g. payout order (bid vs. fixed turn). Wraps one or more RadioGroupItem. */
export function RadioGroup({ value, onValueChange, name, disabled, children, className }: RadioGroupProps) {
  return (
    <RadixRadioGroup.Root
      value={value}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
      className={cx("grid gap-2", className)}
    >
      {children}
    </RadixRadioGroup.Root>
  );
}

export interface RadioGroupItemProps {
  value: string;
  label?: string;
  /** With a description, the item renders as a selectable card (turquoise hairline + quiet fill when selected). */
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioGroupItem({ value, label, description, disabled, className }: RadioGroupItemProps) {
  return (
    <RadixRadioGroup.Item
      value={value}
      disabled={disabled}
      className={cx(
        "group flex min-h-[var(--tap-min)] w-full cursor-pointer gap-3 text-left [transition:var(--transition-control)] disabled:cursor-not-allowed",
        description
          ? "items-start rounded-md border border-border-subtle bg-surface-card p-3 data-[state=checked]:border-border-brand data-[state=checked]:bg-surface-brand-quiet"
          : "items-center border-0 bg-transparent p-0",
        className
      )}
    >
      <span
        className={cx(
          "grid h-[22px] w-[22px] flex-none place-items-center rounded-pill border-[1.5px] border-border-default bg-surface-card",
          "group-[[data-state=checked]:not([data-disabled])]:border-brand-primary",
          description ? "mt-px" : "mt-0"
        )}
      >
        <RadixRadioGroup.Indicator>
          <span className="block h-[11px] w-[11px] rounded-pill bg-brand-primary group-data-[disabled]:bg-text-subtle" />
        </RadixRadioGroup.Indicator>
      </span>
      <span className="grid gap-0.5">
        {label ? (
          <span className="font-core text-[15px] font-medium leading-[1.5] text-text-strong group-data-[disabled]:text-text-subtle">
            {label}
          </span>
        ) : null}
        {description ? (
          <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{description}</span>
        ) : null}
      </span>
    </RadixRadioGroup.Item>
  );
}
