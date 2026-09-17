import type { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const SIZE_CLASSES = {
  sm: "h-9 min-w-9 gap-1.5 px-3.5 font-core text-[13.5px] font-semibold leading-[1.2]",
  md: "h-11 min-w-11 gap-2 px-5 font-core text-[15px] font-semibold leading-[1.2]",
  lg: "h-13 min-w-13 gap-2.5 px-[26px] font-core text-[17px] font-bold leading-[1.2]",
} as const;

const ICON_SIZE = { sm: 16, md: 18, lg: 20 } as const;

const VARIANT_CLASSES = {
  primary:
    "border-transparent bg-brand-primary text-brand-on-primary shadow-[var(--shadow-1)] hover:bg-brand-primary-hover active:bg-brand-primary-press active:shadow-none",
  accent:
    "border-transparent bg-accent-saffron text-on-accent-saffron shadow-[var(--shadow-1)] hover:bg-saffron-300 active:bg-accent-saffron-press active:shadow-none",
  secondary:
    "border border-border-default bg-surface-card text-text-strong hover:border-border-strong hover:bg-surface-sunken active:bg-surface-sunken active:shadow-[var(--shadow-press)]",
  ghost:
    "border-transparent bg-transparent text-text-strong hover:bg-surface-sunken active:bg-surface-sunken active:shadow-[var(--shadow-press)]",
  danger:
    "border-transparent bg-status-danger text-white shadow-[var(--shadow-1)] hover:bg-pom-500 active:bg-pom-500 active:shadow-none",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = turquoise fill · accent = saffron, money-moving confirmations · secondary = hairline · ghost · danger */
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  /** Stretch to container width — used for the pinned bottom action on decision screens. */
  full?: boolean;
  disabled?: boolean;
  /** Shows a spinner glyph and blocks interaction. */
  loading?: boolean;
  /** Icon name rendered before the label. */
  iconLeft?: IconName;
  /** Icon name rendered after the label. */
  iconRight?: IconName;
}

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  children,
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  const off = disabled || loading;
  const iconSize = ICON_SIZE[size];

  return (
    <button
      type={type}
      disabled={off}
      className={cx(
        "cursor-pointer items-center justify-center whitespace-nowrap rounded-pill tracking-[var(--tracking-body)] [transition:var(--transition-control)] active:scale-[var(--press-scale)]",
        full ? "flex w-full" : "inline-flex w-auto",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-sunken disabled:text-text-subtle disabled:shadow-none",
        className
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="loader" size={iconSize} />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={iconSize} />
      ) : null}
      {children}
      {iconRight && !loading ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
}
