import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import ThemeProvider from '@/contexts/ThemeProvider'
import { CompanySettingsProvider } from '@/contexts/CompanySettingsContext'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors`}>        
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
