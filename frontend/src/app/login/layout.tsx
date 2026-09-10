import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تسجيل الدخول | EGYMOTELZ",
  description: "سجّل الدخول إلى حسابك في EGYMOTELZ للوصول إلى لوحة تحكم المالك أو المقاول أو الشريك.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
