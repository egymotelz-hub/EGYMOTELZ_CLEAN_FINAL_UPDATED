import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/LocaleContext";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "EGYMOTELZ — The Key to Hospitality",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
        {/*
          Priority 1 fix (form label position): the server always renders
          dir="rtl" above (Next.js layouts can't read localStorage). Without
          this, a returning visitor whose saved language is English sees a
          flash of RTL — including English form labels briefly right-aligned
          — until LocaleContext's effect runs after hydration. This inline
          script runs before paint and applies the saved language
          immediately, matching the standard flash-of-wrong-direction fix
          pattern. It only ever reads the same "egymotelz-locale" key
          LocaleContext already writes — no new storage mechanism.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem("egymotelz-locale");if(l==="en"){document.documentElement.lang="en";document.documentElement.dir="ltr";}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <LocaleProvider>
          <AuthProvider>{children}</AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
