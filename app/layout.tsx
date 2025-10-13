import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WhatsAppButton from "@/components/WhatsAppButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VerificaYa - Verifica Inquilinos Profesionalmente",
  description: "Verifica inquilinos de forma profesional con ASNEF, NIE/DNI, ingresos y referencias. Informes en 24h desde €49. Protege tu patrimonio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <WhatsAppButton 
          phoneNumber="34612345678"
          message="Hola! Tengo una consulta sobre VerificaYa"
          position="bottom-right"
        />
      </body>
    </html>
  );
}
