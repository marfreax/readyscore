import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReadyScore — Personality Assessment",
  description: "ReadyScore membantu memahami pola diri melalui enam assessment: Cognitive, Emotional Intelligence, DISC, RIASEC, Work Attitude, dan Learning Preference.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
