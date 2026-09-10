"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { destinationForRoles } from "@/lib/postLoginRouting";

export default function OAuthCallbackCompletePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // The httpOnly cookie set by the backend redirect didn't produce a
      // session on refresh — treat as a failed login rather than looping.
      router.replace("/login?oauth_error=session_failed");
      return;
    }
    router.replace(destinationForRoles(user.roles ?? []));
  }, [loading, user, router]);

  return (
    <div className="screen active" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ fontFamily: "var(--fnar)", color: "var(--mut)" }}>جاري تسجيل الدخول...</p>
    </div>
  );
}
