import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

const SIZE_CLASSES = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-12 w-12",
} as const;

const VARIANT_CLASSES = {
  primary: "border-transparent bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover active:bg-brand-primary-press",
  ghost: "border-transparent bg-transparent text-text-strong hover:bg-surface-sunken active:bg-surface-sunken",
  outline: "border-border-default bg-surface-card text-text-strong hover:bg-surface-sunken active:bg-surface-sunken",
} as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon name. */
  icon: IconName;
  /** Required accessible label, also used as the tooltip title. */
  label: string;
  variant?: keyof typeof VARIANT_CLASSES;
  size?: keyof typeof SIZE_CLASSES;
  disabled?: boolean;
}

/** Circular icon-only control for app bars, row affordances and dismissals. Always carries a label for a11y. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "ghost", size = "md", disabled = false, className, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-pill border [transition:var(--transition-control)] active:scale-[var(--press-scale)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-sunken disabled:text-text-subtle",
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className
      )}
      {...rest}
    >
      <Icon name={icon} size={size === "sm" ? 18 : 20} />
    </button>
  );
});
