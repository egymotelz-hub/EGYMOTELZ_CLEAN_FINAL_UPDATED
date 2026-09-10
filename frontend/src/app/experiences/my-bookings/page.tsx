import { redirect } from "next/navigation";

// Phase 6 (unified Booking Area): superseded by /my-bookings, which shows
// both accommodation and offering bookings together — this offering-only
// version is kept only as page.tsx.superseded-by-unified-booking-area for
// reference, not deleted, and now simply redirects so no existing link
// (bookmarked, shared, or indexed) breaks.
export default function LegacyExperiencesMyBookingsRedirect() {
  redirect("/my-bookings");
}
