"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Item 8: the Investment Calculator was moved into the Owner Dashboard
 * (/owner/dashboard) rather than living as its own standalone page. This
 * route is kept only so any existing link/bookmark to /calc still lands
 * somewhere useful instead of 404ing.
 */
export default function CalcRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/owner/dashboard");
  }, [router]);
  return null;
}
