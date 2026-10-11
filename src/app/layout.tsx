import type { Metadata, Viewport } from "next";
import { Assistant, Bellefair } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { IS_DEMO } from "@/lib/demo";

const bellefair = Bellefair({
  weight: "400",
  subsets: ["hebrew", "latin"],
  variable: "--font-bellefair",
  display: "swap",
});

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dor.Bari | קונדיטוריה בעבודת יד",
    template: "%s | Dor.Bari",
  },
  description:
    "עוגות, טארטים, עוגיות ומאפים בעבודת יד מבית הקונדיטורית דורה. מזמינים באתר ואוספים טריים.",
  icons: { icon: "/brand/icon.png" },
  ...(IS_DEMO && { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  themeColor: "#fffcfa",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" data-scroll-behavior="smooth" className={`${bellefair.variable} ${assistant.variable}`}>
      <body>
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          toastOptions={{
            style: {
              fontFamily: "var(--font-assistant)",
              fontSize: "16px",
              borderRadius: "14px",
              border: "1px solid var(--color-crumb)",
              background: "#fff",
              color: "var(--color-ganache)",
            },
          }}
        />
      </body>
    </html>
  );
}
