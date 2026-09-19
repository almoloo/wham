import type { TextareaHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> {
  label?: string;
  hint?: string;
  error?: string;
  rows?: number;
}

export function Textarea({
  label,
  hint,
  error,
  rows = 4,
  disabled = false,
  id,
  className,
  ...rest
}: TextareaProps) {
  const textareaId = id || (label ? "ta-" + String(label).replace(/\s+/g, "-").toLowerCase() : undefined);

  return (
    <div className={cx("grid gap-1.5", className)}>
      {label ? (
        <label htmlFor={textareaId} className="font-core text-[13.5px] font-semibold leading-[1.2] text-text-strong">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        disabled={disabled}
        rows={rows}
        className={cx(
          "min-h-11 resize-y rounded-md border py-3 px-3.5 font-core text-[17px] font-normal leading-[1.5] text-text-strong outline-none [transition:var(--transition-control)] disabled:bg-surface-sunken disabled:text-text-subtle",
          disabled ? "bg-surface-sunken" : "bg-surface-card",
          error
            ? "border-status-danger focus:shadow-[var(--focus-ring-danger)]"
            : "border-border-default focus:border-brand-primary focus:shadow-[var(--focus-ring)]"
        )}
        {...rest}
      />
      {error ? (
        <span className="font-core text-[13.5px] font-normal leading-[1.5] text-status-danger-text">{error}</span>
      ) : hint ? (
        <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
