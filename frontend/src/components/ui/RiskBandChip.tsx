import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

const BANDS = {
  A: { bg: "bg-turq-50", fg: "text-turq-700", dot: "bg-turq-500", label: "Established wallet, long clean history" },
  B: { bg: "bg-warm-100", fg: "text-turq-700", dot: "bg-turq-300", label: "Established wallet, shorter circle history" },
  C: { bg: "bg-warm-100", fg: "text-saffron-600", dot: "bg-saffron-300", label: "Newer wallet or thinner history" },
  D: { bg: "bg-saffron-50", fg: "text-saffron-600", dot: "bg-saffron-400", label: "Little on-chain history yet — larger deposit, same terms" },
} as const;

export interface RiskBandChipProps extends HTMLAttributes<HTMLSpanElement> {
  band?: keyof typeof BANDS;
  /** Also show the short descriptor sentence beside the letter. */
  expanded?: boolean;
}

/** A one-letter deposit-sizing band (A–D). Deliberately neutral — never a grade or a stigma. Calm green through muted amber, never red. */
export function RiskBandChip({ band = "B", expanded = false, className, ...rest }: RiskBandChipProps) {
  const b = BANDS[band];

  return (
    <span className={cx("inline-flex items-center gap-2", className)} {...rest}>
      <span
        className={cx(
          "relative grid h-[26px] w-[26px] place-items-center rounded-pill font-core font-bold text-[13px] leading-none",
          b.bg,
          b.fg
        )}
      >
        <span className="relative">
          {band}
          <span className={cx("absolute -end-2 -top-0.5 h-[5px] w-[5px] rounded-pill", b.dot)} />
        </span>
      </span>
      {expanded ? (
        <span className="max-w-[34ch] text-text-muted" style={{ font: "var(--text-body-s)" }}>
          Band {band} — {b.label}
        </span>
      ) : null}
    </span>
  );
}
