import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export type ToastTone = "neutral" | "success" | "danger" | "info";

const TONE: Record<ToastTone, { color: string; icon: IconName }> = {
  success: { color: "var(--status-success)", icon: "check-circle-2" },
  danger: { color: "var(--status-danger)", icon: "alert-triangle" },
  info: { color: "var(--status-info)", icon: "info" },
  neutral: { color: "var(--warm-700)", icon: "info" },
};

export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  tone?: ToastTone;
  title: string;
  /** Second line with the specifics — amount, date, tx. */
  detail?: string;
  onDismiss?: () => void;
  /** Single text action, e.g. "View receipt". */
  action?: string;
  onAction?: () => void;
}

/** Transient confirmation on the ink surface. Money outcomes get a Dialog or a screen, never only a toast. */
export function Toast({ tone = "neutral", title, detail, onDismiss, action, onAction, className, ...rest }: ToastProps) {
  const { color, icon } = TONE[tone];

  return (
    <div
      role="status"
      className={cx(
        "flex max-w-[420px] items-start gap-3 rounded-md bg-warm-900 py-3 px-3.5 text-warm-50 shadow-[var(--shadow-3)]",
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={18} color={color} className="mt-px" />
      <div className="grid flex-1 gap-0.5">
        <span className="font-core text-[13.5px] font-semibold leading-[1.2]">{title}</span>
        {detail ? <span className="font-core text-[13.5px] font-normal leading-[1.5] text-warm-300">{detail}</span> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="cursor-pointer border-0 bg-transparent p-0 font-core text-[13.5px] font-semibold leading-[1.2] text-turq-200"
        >
          {action}
        </button>
      ) : onDismiss ? (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="cursor-pointer border-0 bg-transparent p-0 text-warm-400">
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
