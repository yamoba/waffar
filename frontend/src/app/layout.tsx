import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Waffar.eg - Compare product prices in Egypt",
    template: "%s | Waffar.eg",
  },
  description: "Egypt's smarter product price comparison platform. Compare prices, track drops, discover deals, and get instant alerts.",
  keywords: ["price comparison", "Egypt deals", "discounts", "Waffar.eg", "وفر"],
  openGraph: {
    type: "website",
    locale: "en_EG",
    url: "https://waffar.co",
    siteName: "Waffar.eg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="bottom-center"
            toastOptions={{
              className: "!bg-gray-900 !text-white dark:!bg-white dark:!text-gray-900 !rounded-xl !shadow-2xl",
              duration: 3000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
