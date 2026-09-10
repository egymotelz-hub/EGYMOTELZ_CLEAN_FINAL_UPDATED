import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EGYMOTELZ — منصة تحويل العقارات إلى وحدات ضيافة احترافية",
  description:
    "EGYMOTELZ منصة مصرية لتحويل العقارات إلى وحدات سكنية مفروشة تُدار باحترافية. انضم كمالك عقار، استكشف الوحدات المتاحة، كن شريكًا في التشطيب والتشغيل، أو اطّلع على فرص الاستثمار القادمة.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
