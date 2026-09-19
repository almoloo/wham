"use client";

import { Checkbox as RadixCheckbox } from "radix-ui";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export interface CheckboxProps {
  checked?: boolean;
  /** Receives the next boolean value (see spec Decision 3 — corrected from the source's ChangeEvent signature, which no longer applies once the control is a real button, not an input). */
  onChange?: (checked: boolean) => void;
  label?: string;
  /** Second line — the consequence being agreed to. */
  description?: string;
  disabled?: boolean;
  className?: string;
}

/** Consent and multi-select control. Used for circle rules acknowledgement before joining. */
export function Checkbox({ checked = false, onChange, label, description, disabled = false, className }: CheckboxProps) {
  return (
    <label
      className={cx(
        "flex gap-3",
        description ? "items-start" : "items-center",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        "min-h-[var(--tap-min)]",
        className
      )}
    >
      <RadixCheckbox.Root
        checked={checked}
        onCheckedChange={(state) => onChange?.(state === true)}
        disabled={disabled}
        className={cx(
          "grid h-[22px] w-[22px] flex-none place-items-center rounded-xs border bg-surface-card [transition:var(--transition-control)]",
          description ? "mt-0.5" : "mt-0",
          "border-border-default",
          "data-[state=checked]:[&:not(:disabled)]:border-brand-primary data-[state=checked]:[&:not(:disabled)]:bg-brand-primary",
          "disabled:bg-surface-sunken"
        )}
      >
        <RadixCheckbox.Indicator>
          <Icon name="check" size={15} color={disabled ? "var(--text-subtle)" : "var(--brand-on-primary)"} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
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
    </label>
  );
}
