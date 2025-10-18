import type { Metadata } from "next";
import { Poppins, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import ThemeProvider from '@/contexts/ThemeProvider'
import { CompanySettingsProvider } from '@/contexts/CompanySettingsContext'

const argonSans = Poppins({
  variable: "--font-argon-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const argonMono = Fira_Code({
  variable: "--font-argon-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qualis Digital - Care Management System",
  description: "Comprehensive care management system for UK care companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${argonSans.variable} ${argonMono.variable} antialiased bg-background text-foreground transition-colors`}>        
        <ThemeProvider>
          <CompanySettingsProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </CompanySettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
