/**
 * The Wham mark's two shapes (turquoise block, saffron bar), shared by every
 * generated icon (icon.tsx, apple-icon.tsx) so the path data has exactly one
 * source instead of a copy per file. Matches public/brand/logo.svg exactly —
 * update all three together if the mark ever changes.
 */
export const MARK_VIEWBOX = "0 0 100 100";

export const MARK_PATHS: { d: string; fill: string }[] = [
  {
    d: "M0 20C0 8.9543 8.95431 0 20 0H80C91.0457 0 100 8.95431 100 20V60H20C8.9543 60 0 51.0457 0 40V20Z",
    fill: "#1B8B85",
  },
  {
    d: "M0 85C0 76.7157 6.71573 70 15 70H100V80C100 91.0457 91.0457 100 80 100H15C6.71573 100 0 93.2843 0 85V85Z",
    fill: "#E8A33D",
  },
];
