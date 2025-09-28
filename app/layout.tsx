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
        {/* ✅ Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js?client=ca-pub-2159359175366212"
          crossOrigin="anonymous"
        ></script>

        
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MovieServiceProvider>
            {children}

          </MovieServiceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
