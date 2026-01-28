import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import LayoutWithNav from "@/components/LayoutWithNav";
import { Background } from "@/components/Background";
import { AuthProvider } from "../context/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Gestão Loja",
  description: "Sistema de monitoramento e organização de renda",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <AuthProvider>
          <Background />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
