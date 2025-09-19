// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { MovieServiceProvider } from "@/services/movie_service";
import Script from "next/script"; // ✅ Import Script

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DJ Afro Movies - Stream Your Favorite Movies",
  description: "Watch the best DJ Afro commentary movies online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* ✅ AdSense verification script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js?client=ca-pub-2159359175366212"
          crossOrigin="anonymous"
        ></script>

        {/* ✅ Adsterra Social Bar (loads globally) */}
        <Script
          id="adsterra-socialbar"
          src="//pl27677533.revenuecpmgate.com/06/c1/56/06c156ac7f5d888ddd430a93206604ba.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MovieServiceProvider>
            {children}

            {/* ✅ Adsterra Native Banner Placement */}
            <div id="container-e921527a646b49b8bddbe30f8c16d338"></div>
            <Script
              id="adsterra-native"
              src="//pl27677477.revenuecpmgate.com/e921527a646b49b8bddbe30f8c16d338/invoke.js"
              strategy="afterInteractive"
            />
          </MovieServiceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
