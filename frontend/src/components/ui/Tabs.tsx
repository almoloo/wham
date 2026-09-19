"use client";

import { Tabs as RadixTabs } from "radix-ui";
import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "dir"> {
  items: Array<string | TabItem>;
  value: string;
  onChange?: (value: string) => void;
}

/** Underlined tab row for switching views inside a screen (Open circles / My circles / Completed). */
export function Tabs({ items = [], value, onChange, className, ...rest }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onChange} className={className} {...rest}>
      <RadixTabs.List className="flex gap-[22px] border-b border-border-subtle">
        {items.map((item) => {
          const t = typeof item === "string" ? { value: item, label: item } : item;
          return (
            <RadixTabs.Trigger
              key={t.value}
              value={t.value}
              className="group -mb-px flex cursor-pointer items-center gap-[7px] border-0 border-b-2 border-transparent bg-transparent pb-3 font-core text-[15px] font-semibold leading-[1.2] text-text-muted [transition:var(--transition-control)] data-[state=active]:border-brand-primary data-[state=active]:text-text-strong"
            >
              {t.label}
              {typeof t.count === "number" ? (
                <span
                  className={cx(
                    "rounded-pill bg-surface-sunken py-[3px] px-[7px] font-core text-[12px] font-semibold leading-none tabular-nums text-text-muted",
                    "group-data-[state=active]:bg-surface-brand-quiet group-data-[state=active]:text-text-brand"
                  )}
                >
                  {t.count}
                </span>
              ) : null}
            </RadixTabs.Trigger>
          );
        })}
      </RadixTabs.List>
    </RadixTabs.Root>
  );
}
