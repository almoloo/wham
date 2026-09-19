"use client";

import { Dialog as RadixDialog } from "radix-ui";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { IconButton } from "./IconButton";

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  title?: string;
  /** One or two sentences that state the consequence being confirmed. */
  description?: string;
  onClose?: () => void;
  /** Action row, usually two Buttons. */
  footer?: ReactNode;
  /** Render as a bottom sheet (mobile default for money confirmations). */
  sheet?: boolean;
  children?: ReactNode;
}

/** Modal or bottom sheet over a blurred scrim (--blur-sheet, 46% ink). Confirmations that move money live here. */
export function Dialog({ open = true, title, description, onClose, footer, sheet = false, children, className, ...rest }: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-[var(--surface-scrim)] [backdrop-filter:var(--blur-sheet)] [-webkit-backdrop-filter:var(--blur-sheet)]" />
        <RadixDialog.Content
          {...(!description ? { "aria-describedby": undefined } : {})}
          className={cx(
            "fixed z-40 grid w-full gap-4 bg-surface-card p-5 shadow-[var(--shadow-4)] outline-none",
            sheet
              ? "inset-x-0 bottom-0 max-w-none rounded-t-xl"
              : "left-1/2 top-1/2 max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl",
            className
          )}
          {...rest}
        >
          {sheet ? <span className="h-1 w-11 justify-self-center rounded-[2px] bg-border-default" /> : null}
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-[5px]">
              <RadixDialog.Title className={cx("font-core text-[22px] font-bold leading-[1.18] text-text-strong", !title && "sr-only")}>
                {title || "Dialog"}
              </RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="max-w-[46ch] font-core text-[15px] font-normal leading-[1.5] text-text-muted">
                  {description}
                </RadixDialog.Description>
              ) : null}
            </div>
            <RadixDialog.Close asChild>
              <IconButton icon="x" label="Close" size="sm" />
            </RadixDialog.Close>
          </div>
          {children}
          {footer ? <div className="flex gap-2.5">{footer}</div> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
