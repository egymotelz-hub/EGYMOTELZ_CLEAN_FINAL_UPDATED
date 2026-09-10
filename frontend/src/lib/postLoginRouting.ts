// Destination is derived entirely from the roles the backend already
// returns on the authenticated user — no new roles invented here.
// hotel_management_company and partner have no dashboard route yet (none
// exists anywhere in the codebase today), so they intentionally fall
// through to the home page rather than link to something that isn't built.
export function destinationForRoles(roles: string[]): string {
  if (roles.some((r) => ["admin", "super_admin", "employee", "manager"].includes(r))) return "/admin";
  if (roles.includes("finance_staff")) return "/finance";
  if (roles.includes("owner")) return "/owner/dashboard";
  if (roles.includes("contractor")) return "/contractor";
  if (roles.includes("financial_partner")) return "/financial-partner";
  return "/home";
}
