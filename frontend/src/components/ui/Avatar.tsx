import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const SIZE_PX = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 } as const;
const SIZE_CLASSES = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-18 w-18",
} as const;

export type AvatarBand = "none" | "thin" | "building" | "solid" | "trusted";

const RING_VAR: Record<Exclude<AvatarBand, "none">, string> = {
  trusted: "var(--score-trusted)",
  solid: "var(--score-solid)",
  building: "var(--score-building)",
  thin: "var(--score-thin)",
};

const TINT_POOL = ["var(--turq-100)", "var(--saffron-100)", "var(--pom-100)", "var(--lapis-100)", "var(--warm-200)"];

export function getInitials(name?: string): string {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

/** Deterministic warm tint from the name, so a member looks the same everywhere. */
export function getAvatarTint(name?: string): string {
  let sum = 0;
  for (let i = 0; i < String(name ?? "").length; i++) sum += String(name).charCodeAt(i);
  return TINT_POOL[sum % TINT_POOL.length];
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Display name — drives initials and the tint. */
  name?: string;
  /** Photo URL. Wham has no illustrated default avatars. */
  src?: string;
  size?: keyof typeof SIZE_PX;
  /** Reputation band ring. */
  band?: AvatarBand;
}

/** Member identity. Initials on a deterministic warm tint unless a photo is supplied; optional reputation-band ring. */
export function Avatar({ name, src, size = "md", band = "none", className, style, ...rest }: AvatarProps) {
  const d = SIZE_PX[size];
  const ringed = band !== "none";

  return (
    <span
      title={name}
      className={cx(
        "grid flex-none place-items-center overflow-hidden rounded-pill font-core font-bold leading-none text-text-strong",
        src ? "bg-surface-sunken" : undefined,
        SIZE_CLASSES[size],
        className
      )}
      style={{
        fontSize: Math.round(d * 0.36),
        background: src ? undefined : getAvatarTint(name),
        boxShadow: ringed
          ? `0 0 0 2px ${RING_VAR[band as Exclude<AvatarBand, "none">]}, 0 0 0 4px var(--surface-card)`
          : "inset 0 0 0 1px var(--border-subtle)",
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img src={src} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
