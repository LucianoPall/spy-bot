import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AdClone — Clone criativos vencedores do Facebook Ads em minutos",
    template: "%s | AdClone",
  },
  description:
    "Espione, analise e clone os anúncios que mais convertem no Facebook Ads Library. Gere variantes de copy e imagens com IA em minutos. Triplique seu ROI sem queimar verba.",
  keywords: [
    "facebook ads",
    "espionar anúncios",
    "clonar criativos",
    "ad spy",
    "biblioteca de anúncios",
    "criativos com IA",
    "gestor de tráfego",
    "ROI Facebook Ads",
  ],
  authors: [{ name: "AdClone" }],
  creator: "AdClone",
  publisher: "AdClone",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "AdClone — Clone criativos vencedores do Facebook Ads em minutos",
    description:
      "Espione, analise e clone os anúncios que mais convertem. Variantes de copy e imagens com IA, em minutos.",
    siteName: "AdClone",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdClone — Clone criativos vencedores do Facebook Ads",
    description:
      "Espione, analise e clone os anúncios que mais convertem. Variantes de copy e imagens com IA, em minutos.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
