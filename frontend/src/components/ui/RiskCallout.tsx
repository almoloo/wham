import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const TONES: Record<
  NonNullable<RiskCalloutProps["tone"]>,
  { bg: string; fg: string; accent: string; icon: IconName }
> = {
  warning: { bg: "bg-status-warning-surface", fg: "text-status-warning-text", accent: "var(--status-warning)", icon: "alert-triangle" },
  danger: { bg: "bg-status-danger-surface", fg: "text-status-danger-text", accent: "var(--status-danger)", icon: "alert-triangle" },
  info: { bg: "bg-status-info-surface", fg: "text-status-info-text", accent: "var(--status-info)", icon: "info" },
  success: { bg: "bg-status-success-surface", fg: "text-status-success-text", accent: "var(--status-success)", icon: "check-circle-2" },
};

export interface RiskCalloutProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "warning" | "danger" | "info" | "success";
  title?: string;
  /** The consequence, with a date. */
  children?: ReactNode;
  /** Optional single Button. */
  action?: ReactNode;
  /** Override the default Lucide glyph. */
  icon?: IconName;
}

/** States a risk, deadline or consequence inline. Factual, never blaming, always with the date and the outcome. */
export function RiskCallout({ tone = "warning", title, children, action, icon, className, ...rest }: RiskCalloutProps) {
  const t = TONES[tone];

  return (
    <div className={cx("flex items-start gap-3 rounded-md p-3.5", t.bg, className)} {...rest}>
      <Icon name={icon ?? t.icon} size={18} color={t.accent} className="mt-px" />
      <div className="grid flex-1 gap-1.5">
        {title ? (
          <span className={t.fg} style={{ font: "var(--text-ui-s)" }}>
            {title}
          </span>
        ) : null}
        <div className={cx("max-w-[52ch] opacity-[0.92]", t.fg)} style={{ font: "var(--text-body-s)" }}>
          {children}
        </div>
        {action ? <div className="mt-0.5">{action}</div> : null}
      </div>
    </div>
  );
}
