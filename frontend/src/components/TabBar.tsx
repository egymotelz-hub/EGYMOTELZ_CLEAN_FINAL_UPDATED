"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface TabDef {
  href: string;
  label: string;
  /** Undefined = public, always visible. Otherwise: visible only if the
   * logged-in user holds one of these roles — Items 9 & 18. */
  roles?: string[];
  /** True = only show when NOT logged in (e.g. Login itself). */
  hideWhenAuthed?: boolean;
}

const TABS: TabDef[] = [
  { href: "/", label: "🌐 Language / اللغة" },
  { href: "/home", label: "🏠 الرئيسية" },
  { href: "/listings", label: "🏨 الوحدات" },
  { href: "/owners", label: "🏢 انضم كمالك" },
  { href: "/booking", label: "📅 احجز إقامة" },
  // Item 9: Administration and Finance are removed from the public navbar —
  // they only appear once logged in with the matching role. Calculator was
  // already relocated into the Owner Dashboard (Item 8), so there's no
  // separate calculator tab to hide here.
  { href: "/admin", label: "⚙️ الإدارة", roles: ["admin", "super_admin", "employee", "manager"] },
  { href: "/finance", label: "💰 المالية", roles: ["finance_staff", "super_admin"] },
  { href: "/owner/dashboard", label: "👤 لوحة المالك" },
  { href: "/contractor/register", label: "🔧 التسجيل كمقاول" },
  { href: "/hotel-management-companies/register", label: "🏨 شركات إدارة العقارات الفندقية" },
  { href: "/partners/interior-design", label: "🎨 تصميم داخلي وتشطيبات" },
  { href: "/partners/other", label: "🤝 شركاء آخرون" },
  { href: "/investor", label: "📈 مستثمر" },
  { href: "/login", label: "🔑 تسجيل الدخول", hideWhenAuthed: true },
  { href: "/about", label: "ℹ️ من نحن" },
];

export function TabBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleTabs = TABS.filter((tab) => {
    if (tab.hideWhenAuthed && user) return false;
    if (!tab.roles) return true; // public tab
    return user?.roles.some((r) => tab.roles!.includes(r)) ?? false;
  });

  return (
    <div className="tabs">
      {visibleTabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`tab${pathname === tab.href ? " active" : ""}`}>
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
