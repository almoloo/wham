/** Joins class names, skipping falsy values. Not a full clsx — just enough for merging a component's base classes with an optional caller className. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
