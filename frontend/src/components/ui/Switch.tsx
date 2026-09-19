"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { cx } from "@/lib/cx";

export interface SwitchProps {
  checked?: boolean;
  /** Receives the next boolean value. */
  onChange?: (next: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Immediate-effect toggle — reminders, auto-pay, public reputation. Never used to submit a form. */
export function Switch({ checked = false, onChange, label, description, disabled = false, className }: SwitchProps) {
  return (
    <label
      className={cx(
        "flex min-h-[var(--tap-min)] items-center justify-between gap-4",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        className
      )}
    >
      <span className="grid gap-0.5">
        {label ? (
          <span
            className={cx(
              "font-core text-[15px] font-medium leading-[1.5]",
              disabled ? "text-text-subtle" : "text-text-strong"
            )}
          >
            {label}
          </span>
        ) : null}
        {description ? (
          <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{description}</span>
        ) : null}
      </span>
      <RadixSwitch.Root
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className={cx(
          "flex h-7 w-12 flex-none items-center justify-start rounded-pill bg-warm-300 p-[3px] [transition:background-color_var(--duration-fast)_var(--ease-out)]",
          "data-[state=checked]:[&:not(:disabled)]:bg-brand-primary data-[state=checked]:justify-end",
          "disabled:bg-surface-sunken"
        )}
      >
        <RadixSwitch.Thumb className="h-[22px] w-[22px] rounded-pill bg-white shadow-[var(--shadow-1)]" />
      </RadixSwitch.Root>
    </label>
  );
}
