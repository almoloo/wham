import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import { Avatar } from "./Avatar";

export interface StackMember {
  name?: string;
  src?: string;
}

export interface AvatarStackProps extends HTMLAttributes<HTMLSpanElement> {
  /** Names or { name, src } objects. */
  members: Array<string | StackMember>;
  /** How many to render before collapsing into +N. */
  max?: number;
  size?: "xs" | "sm" | "md";
  /** Real group size, when members[] is only a sample. */
  total?: number;
}

const RING_SHADOW = "shadow-[0_0_0_2px_var(--surface-card)]";

/** Overlapping member avatars with a +N overflow chip. Used on circle cards to show who is in. */
export function AvatarStack({ members = [], max = 5, size = "sm", total, className, ...rest }: AvatarStackProps) {
  const shown = members.slice(0, max);
  const overflowCount = (typeof total === "number" ? total : members.length) - shown.length;

  return (
    <span className={cx("inline-flex items-center", className)} {...rest}>
      {shown.map((member, i) => {
        const { name, src } = typeof member === "string" ? { name: member, src: undefined } : member;
        return (
          <span key={i} className={cx("rounded-pill", RING_SHADOW, i > 0 && "-ms-2")}>
            <Avatar name={name} src={src} size={size} />
          </span>
        );
      })}
      {overflowCount > 0 ? (
        <span
          className={cx(
            "-ms-2 grid place-items-center rounded-pill bg-surface-sunken px-[7px] font-core text-xs font-semibold leading-none tabular-nums text-text-muted",
            RING_SHADOW,
            size === "xs" ? "h-6 min-w-6" : "h-8 min-w-8"
          )}
        >
          +{overflowCount}
        </span>
      ) : null}
    </span>
  );
}
