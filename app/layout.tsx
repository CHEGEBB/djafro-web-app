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

        {/* ✅ Adsterra Social Bar */}
        <Script
          id="adsterra-socialbar"
          src="//pl27677533.revenuecpmgate.com/06/c1/56/06c156ac7f5d888ddd430a93206604ba.js"
          strategy="afterInteractive"
        />

        {/* ✅ SmartLink */}
        <Script
          id="smartlink"
          src="https://www.revenuecpmgate.com/d9sm3jmc12?key=d5721fb7c23794879de52775b8db04bf"
          strategy="afterInteractive"
        />

        {/* ✅ PopUnder Ads */}
        <Script
          id="popunder"
          src="//pl27677850.revenuecpmgate.com/c7/4e/a6/c74ea6aeb4edc88a21f94854ccc20699.js"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MovieServiceProvider>
            {children}

            {/* ✅ Native Banner Placement */}
            <div
              id="container-e921527a646b49b8bddbe30f8c16d338"
              style={{ margin: "20px 0" }}
            ></div>
            <Script
              id="adsterra-native"
              src="//pl27677477.revenuecpmgate.com/e921527a646b49b8bddbe30f8c16d338/invoke.js"
              strategy="afterInteractive"
            />

            {/* ✅ Small 160x300 Banner */}
            <div id="adsterra-small-banner" style={{ margin: "20px auto" }}>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    atOptions = {
                      'key': 'aabd7cf1d8796d87ade4c3d7a909ec84',
                      'format': 'iframe',
                      'height': 300,
                      'width': 160,
                      'params': {}
                    };
                  `,
                }}
              />
              <Script
                id="adsterra-small-banner-script"
                src="//www.highperformanceformat.com/aabd7cf1d8796d87ade4c3d7a909ec84/invoke.js"
                strategy="afterInteractive"
              />
            </div>

            {/* ✅ Tall 160x600 Banner */}
            <div id="adsterra-tall-banner" style={{ margin: "20px auto" }}>
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    atOptions = {
                      'key': '24ace108dd8f7e91700d74f10072700a',
                      'format': 'iframe',
                      'height': 600,
                      'width': 160,
                      'params': {}
                    };
                  `,
                }}
              />
              <Script
                id="adsterra-tall-banner-script"
                src="//www.highperformanceformat.com/24ace108dd8f7e91700d74f10072700a/invoke.js"
                strategy="afterInteractive"
              />
            </div>
          </MovieServiceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
