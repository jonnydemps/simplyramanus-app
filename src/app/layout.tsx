import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import AuthRedirector from '@/components/auth/AuthRedirector'; // Re-added for standard pattern

const inter = Inter({
  variable: "--font-geist-sans", // Ensure these variable names are used in your CSS (e.g., Tailwind config)
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono", // Ensure these variable names are used in your CSS
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimplyRA | Cosmetic Formulation Compliance",
  description: "Regulatory affairs specialist for Australia and New Zealand cosmetic compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Combine font variables and any other base body classes */}
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <AuthProvider>
          {/* Re-added AuthRedirector wrapper for standard pattern */}
          <AuthRedirector>
            {children}
          </AuthRedirector>
        </AuthProvider>
      </body>
    </html>
  );
}
