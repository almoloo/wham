import type { ElementType, HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Avatar, type AvatarProps } from "./Avatar";
import { RiskBandChip, type RiskBandChipProps } from "./RiskBandChip";

const TEXT_FONT: Record<NonNullable<MemberIdentityProps["size"]>, string> = {
  xs: "var(--text-body-s)",
  sm: "var(--text-body-s)",
  md: "var(--text-ui-s)",
  lg: "var(--text-title-s)",
};

const AVATAR_SIZE: Record<NonNullable<MemberIdentityProps["size"]>, AvatarProps["size"]> = {
  xs: "xs",
  sm: "sm",
  md: "md",
  lg: "lg",
};

function short(address?: string) {
  if (!address) return "";
  return address.length > 10 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export interface MemberIdentityProps extends HTMLAttributes<HTMLElement> {
  name?: string;
  /** Wallet address, used for the deterministic identicon and as the name fallback. */
  address?: string;
  avatarSrc?: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** Quiet treatment marking the viewer's own row/card — not a badge. */
  you?: boolean;
  /** Appends a RiskBandChip. */
  band?: RiskBandChipProps["band"];
  /** Appends the reputation score inline. */
  score?: number;
  /** Renders the whole unit as a link to the public profile. */
  linked?: boolean;
  href?: string;
  /** Free secondary line, e.g. "Joined 6 circles". */
  secondary?: string;
}

/** A person, shown consistently everywhere they appear: identicon + name + optional secondary line. Name resolution is ENS/display name over a bare truncated address. */
export function MemberIdentity({
  name,
  address,
  avatarSrc,
  size = "md",
  you = false,
  band,
  score,
  linked = false,
  href,
  secondary,
  className,
  style,
  ...rest
}: MemberIdentityProps) {
  const display = name || short(address) || "Unknown member";
  const Wrapper: ElementType = linked ? "a" : "div";

  return (
    <Wrapper
      href={linked ? href || "#" : undefined}
      className={cx("inline-flex min-w-0 items-center no-underline", size === "xs" ? "gap-2" : "gap-2.5", className)}
      style={{ color: "inherit", ...style }}
      {...rest}
    >
      <Avatar name={display} src={avatarSrc} size={AVATAR_SIZE[size]} />
      <span className="grid min-w-0 gap-[1px]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={cx("overflow-hidden text-ellipsis whitespace-nowrap", you ? "text-text-brand" : "text-text-strong")}
            style={{ font: TEXT_FONT[size] }}
          >
            {display}
            {you ? " (you)" : ""}
          </span>
          {band ? <RiskBandChip band={band} /> : null}
        </span>
        {secondary || typeof score === "number" ? (
          <span className="text-text-muted" style={{ font: "var(--text-body-s)" }}>
            {secondary}
            {secondary && typeof score === "number" ? " · " : ""}
            {typeof score === "number" ? `${score} score` : ""}
          </span>
        ) : null}
      </span>
    </Wrapper>
  );
}
