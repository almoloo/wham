import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export type BannerTone = "info" | "success" | "warning" | "danger";

const TONE_CLASSES: Record<BannerTone, { surface: string; text: string; iconColor: string; icon: IconName }> = {
  info: { surface: "bg-status-info-surface", text: "text-status-info-text", iconColor: "var(--status-info)", icon: "info" },
  success: {
    surface: "bg-status-success-surface",
    text: "text-status-success-text",
    iconColor: "var(--status-success)",
    icon: "check-circle-2",
  },
  warning: {
    surface: "bg-status-warning-surface",
    text: "text-status-warning-text",
    iconColor: "var(--status-warning)",
    icon: "alert-triangle",
  },
  danger: {
    surface: "bg-status-danger-surface",
    text: "text-status-danger-text",
    iconColor: "var(--status-danger)",
    icon: "alert-triangle",
  },
};

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone;
  title?: ReactNode;
  body?: ReactNode;
  /** Inline text action, e.g. "Retry" or "View details". */
  action?: ReactNode;
  onAction?: () => void;
  /** Shows a dismiss (x) button when provided. */
  onDismiss?: () => void;
}

/** Full-width inline alert for page/section-level state — persistent, unlike the floating Toast. */
export function Banner({ tone = "info", title, body, action, onAction, onDismiss, className, ...rest }: BannerProps) {
  const { surface, text, iconColor, icon } = TONE_CLASSES[tone];

  return (
    <div
      role="alert"
      className={cx("flex items-start gap-3 rounded-md py-3.5 px-4", surface, className)}
      {...rest}
    >
      <Icon name={icon} size={19} color={iconColor} className="mt-px shrink-0" />
      <div className="grid min-w-0 flex-1 gap-0.5">
        {title ? <span className={cx("font-core text-[15px] font-semibold leading-[1.2]", text)}>{title}</span> : null}
        {body ? <span className="font-core text-[13.5px] font-normal leading-[1.5] text-text-muted">{body}</span> : null}
      </div>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className={cx("shrink-0 cursor-pointer whitespace-nowrap border-0 bg-transparent p-0 font-core text-[15px] font-semibold leading-[1.2]", text)}
        >
          {action}
        </button>
      ) : null}
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-text-subtle"
        >
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
