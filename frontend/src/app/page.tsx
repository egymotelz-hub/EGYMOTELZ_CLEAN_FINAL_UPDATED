"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/LocaleContext";

export default function LangPage() {
  const router = useRouter();
  const { setLocale } = useLocale();

  function choose(locale: "ar" | "en") {
    setLocale(locale);
    router.push("/home");
  }

  return (
    <div className="screen active" id="sc-lang">
      <div className="lang-screen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="EGYMOTELZ" className="logo-img" />
        <div>
          <div className="brand-name">EGY MOTELZ</div>
          <div className="brand-tag">The Key to Hospitality</div>
        </div>
        <div className="gold-hr" />
        <div>
          <div className="lang-prompt-en">Choose your language</div>
          <div className="lang-prompt-ar" style={{ marginTop: 4 }}>
            اختر لغتك
          </div>
        </div>
        <div className="lang-btns">
          <button className="lang-btn" onClick={() => choose("ar")}>
            العربية
          </button>
          <button className="lang-btn" onClick={() => choose("en")}>
            English
          </button>
        </div>
      </div>
    </div>
  );
}
