import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sua Mídia — Painel da Agência",
  description: "Sistema interno de gestão de conteúdo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${manrope.variable} h-full antialiased`}>
      <body className="h-full text-slate-100" style={{ backgroundColor: '#0b1326', fontFamily: 'var(--font-manrope), sans-serif' }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
