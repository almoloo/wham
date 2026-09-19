"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { AUTH_COPY } from "@/lib/copy/auth";
import { useSession } from "./SessionProvider";

/** Ends the session, disconnects the wallet and returns to the homepage. */
export function SignOutButton() {
  const { signOut } = useSession();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await signOut();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="secondary" loading={pending} onClick={onClick}>
      {AUTH_COPY.signOut}
    </Button>
  );
}
