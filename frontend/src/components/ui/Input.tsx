import type { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Helper line under the field — state the rule, not an apology. */
  hint?: string;
  /** Replaces hint and turns the field pomegranate. Factual, gives the fix. */
  error?: string;
  /** Static text inside the field, before the value (e.g. "$"). */
  prefix?: string;
  /** Static text inside the field, after the value (e.g. "USDC"). */
  suffix?: string;
  iconLeft?: IconName;
  /** Use the mono face — for addresses, hashes and invite codes. */
  mono?: boolean;
  disabled?: boolean;
}

/** Single-line field, 48px tall, 14px radius. Money fields take prefix="$" and suffix="USDC". */
export function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  iconLeft,
  mono = false,
  disabled = false,
  id,
  className,
  ...rest
}: InputProps) {
  const inputId = id || (label ? "in-" + String(label).replace(/\s+/g, "-").toLowerCase() : undefined);

  return (
    <div className={cx("grid gap-1.5", className)}>
      {label ? (
        <label htmlFor={inputId} className="font-core text-[13.5px] font-semibold leading-[1.2] text-text-strong">
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          "flex h-12 items-center gap-2 rounded-md border px-3.5 [transition:var(--transition-control)]",
          disabled ? "bg-surface-sunken" : "bg-surface-card",
          error
            ? "border-status-danger focus-within:shadow-[var(--focus-ring-danger)]"
            : "border-border-default focus-within:border-brand-primary focus-within:shadow-[var(--focus-ring)]"
        )}
      >
        {iconLeft ? <Icon name={iconLeft} size={18} color="var(--text-subtle)" /> : null}
        {prefix ? <span className="font-core text-[15px] font-semibold leading-[1.2] text-text-muted">{prefix}</span> : null}
        <input
          id={inputId}
          disabled={disabled}
          className={cx(
            "wham-tnum min-w-0 flex-1 border-0 bg-transparent text-text-strong outline-none focus:shadow-none disabled:text-text-subtle",
            mono ? "wham-mono" : "font-core text-[17px] font-normal leading-[1.5]"
          )}
          {...rest}
        />
        {suffix ? <span className="font-core text-[13.5px] font-semibold leading-[1.2] text-text-muted">{suffix}</span> : null}
      </div>
      {error ? (
        <span className="font-core text-[13.5px] font-normal leading-[1.5] text-status-danger-text">{error}</span>
      ) : hint ? (
        <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
