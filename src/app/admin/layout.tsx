import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "../[lang]/globals.css";

const serif = Cormorant_Garamond({ variable: "--font-heading", subsets: ["latin"], weight: ["400", "500", "600"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elora · Admin",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-svh bg-cream-deep font-sans text-brown">{children}</body>
    </html>
  );
}
