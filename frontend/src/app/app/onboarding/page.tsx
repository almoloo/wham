/**
 * Placeholder for first-run onboarding (frontend spec §4, `/app/onboarding`).
 * New wallets land here after their first sign-in. The real page lands in a
 * later feature (spec §9.11). Not a permanent route as written.
 */

import { SignOutButton } from "@/components/auth/SignOutButton";

export default function OnboardingPlaceholder() {
  return (
    <main className="min-h-screen bg-surface-page p-8">
      <div className="mx-auto flex max-w-content-max flex-col items-start gap-4">
        <h1>Onboarding</h1>
        <p className="text-text-muted">This first-run page is a placeholder.</p>
        <SignOutButton />
      </div>
    </main>
  );
}
