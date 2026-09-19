/**
 * Placeholder for the dashboard (frontend spec §4, `/app`). It exists so the
 * post-sign-in redirect and the route gate have a real target; the real page
 * lands in a later feature (spec §9.10). Not a permanent route as written.
 */

import { SignOutButton } from "@/components/auth/SignOutButton";

export default function DashboardPlaceholder() {
  return (
    <main className="min-h-screen bg-surface-page p-8">
      <div className="mx-auto flex max-w-content-max flex-col items-start gap-4">
        <h1>Dashboard</h1>
        <p className="text-text-muted">This page is a placeholder.</p>
        <SignOutButton />
      </div>
    </main>
  );
}
