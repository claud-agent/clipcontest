import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipContest – Starte deinen Clip-Contest, tracke Views, belohne Creator",
  description:
    "Starte einen Clip-Contest auf TikTok, tracke Views live, zeige ein Leaderboard und zahle automatisch an 1–3 Gewinner aus. Für Brands, Creator und Communities.",
  openGraph: {
    title: "ClipContest – Clip-Contests made simple",
    description: "Starte, tracke und gewinne. Dein Contest-Tool für Creator.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
