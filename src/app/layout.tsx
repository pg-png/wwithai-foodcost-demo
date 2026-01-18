import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Food Cost Sentinel - Invoice Capture Demo",
  description: "AI-powered invoice capture and food cost tracking for restaurants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
