import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tarkov Hideout Tracker",
  description: "Track items needed for your next Hideout upgrades",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
