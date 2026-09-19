import type { SelectHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  /** Strings or { value, label } pairs. */
  options: Array<string | SelectOption>;
  disabled?: boolean;
}

/** Native select in Wham field clothing — for round length, currency, group size. */
export function Select({ label, hint, options = [], disabled = false, id, className, ...rest }: SelectProps) {
  const selectId = id || (label ? "sel-" + String(label).replace(/\s+/g, "-").toLowerCase() : undefined);

  return (
    <div className={cx("grid gap-1.5", className)}>
      {label ? (
        <label htmlFor={selectId} className="font-core text-[13.5px] font-semibold leading-[1.2] text-text-strong">
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          "relative flex h-12 items-center rounded-md border [transition:var(--transition-control)] focus-within:border-brand-primary focus-within:shadow-[var(--focus-ring)]",
          disabled ? "bg-surface-sunken" : "bg-surface-card",
          "border-border-default"
        )}
      >
        <select
          id={selectId}
          disabled={disabled}
          className="h-full w-full cursor-pointer appearance-none border-0 bg-transparent py-0 pl-3.5 pr-[42px] font-core text-[17px] font-normal leading-[1.5] text-text-strong outline-none focus:shadow-none disabled:cursor-not-allowed disabled:text-text-subtle"
          {...rest}
        >
          {options.map((option) => {
            const opt = typeof option === "string" ? { value: option, label: option } : option;
            return (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            );
          })}
        </select>
        <Icon name="chevron-down" size={18} color="var(--text-muted)" className="pointer-events-none absolute right-3.5" />
      </div>
      {hint ? <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{hint}</span> : null}
    </div>
  );
}
