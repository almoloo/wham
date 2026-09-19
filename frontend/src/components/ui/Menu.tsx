"use client";

import { DropdownMenu } from "radix-ui";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon, type IconName } from "./Icon";

export interface MenuItem {
  label?: string;
  icon?: IconName;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  /** Renders a hairline instead of an item. */
  divider?: boolean;
}

export interface MenuProps extends HTMLAttributes<HTMLDivElement> {
  /** The clickable element that opens the menu — usually an IconButton. */
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
}

/** Click-outside and Escape both close it; self-contained, no external open state needed. */
export function Menu({ trigger, items = [], align = "start", className, ...rest }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={6}
          className={cx("z-40 min-w-[190px] rounded-md border border-border-subtle bg-surface-card p-1.5 shadow-[var(--shadow-3)]", className)}
          {...rest}
        >
          {items.map((item, i) =>
            item.divider ? (
              <DropdownMenu.Separator key={i} className="mx-1 my-[5px] h-px bg-border-subtle" />
            ) : (
              <DropdownMenu.Item
                key={i}
                disabled={item.disabled}
                onSelect={() => item.onClick?.()}
                className={cx(
                  "flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-sm border-0 bg-transparent px-2.5 text-left font-core text-[13.5px] font-semibold leading-[1.2] outline-none [transition:var(--transition-control)] data-[highlighted]:bg-surface-sunken data-[disabled]:cursor-not-allowed",
                  item.danger ? "text-status-danger-text" : item.disabled ? "text-text-subtle" : "text-text-strong"
                )}
              >
                {item.icon ? (
                  <Icon name={item.icon} size={16} color={item.danger ? "var(--status-danger)" : "var(--text-subtle)"} />
                ) : null}
                {item.label}
              </DropdownMenu.Item>
            )
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
