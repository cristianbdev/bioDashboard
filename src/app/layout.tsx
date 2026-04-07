import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, IBM_Plex_Mono } from "next/font/google";
import { Footer } from "@/components/footer";
import { LocaleProvider } from "@/context/LocaleContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono-scientific",
});
export const metadata: Metadata = {
  title: "Bio Dashboard",
  description: "Dashboard para visualizar resultados de bioseguridad acuicola desde KoboToolbox.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ibmPlexMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <ClerkProvider>
          <LocaleProvider>
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </LocaleProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
