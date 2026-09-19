import {
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Gavel,
  Info,
  Link2,
  Loader,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * The permanent product glyph dictionary (assets/icons.md) plus a few
 * generic UI icons with direct evidence of use (core.card.html's own demo).
 * Add one line here when a later feature needs a new name — don't build a
 * second icon-resolution mechanism.
 */
const ICONS = {
  "alert-triangle": AlertTriangle,
  "calendar-days": CalendarDays,
  check: Check,
  "check-circle-2": CheckCircle2,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  gavel: Gavel,
  info: Info,
  "link-2": Link2,
  loader: Loader,
  plus: Plus,
  "refresh-cw": RefreshCw,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
  users: Users,
  wallet: Wallet,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  /** One of the curated Wham icon names — see assets/icons.md for the product glyph dictionary. */
  name: IconName;
  /** 16 inline with text, 20 UI default, 24 tab bars and empty states. */
  size?: number;
  /** Defaults to currentColor; pass a token like "var(--status-danger)" to override. */
  color?: string;
  className?: string;
}

export function Icon({ name, size = 20, color = "currentColor", className }: IconProps) {
  const LucideGlyph = ICONS[name];
  return <LucideGlyph size={size} color={color} className={className} aria-hidden="true" />;
}
