import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AdSenseScript } from "@/components/AdSense";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.SITE_URL || "https://mizizinodes.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "MiziziNodes — AI Research & Analysis",
    template: "%s — MiziziNodes",
  },
  description: "In-depth AI research, LLM comparisons, agent tutorials, and original analysis of the AI landscape.",
  metadataBase: new URL(siteUrl),
  alternates: {
    types: {
      "application/atom+xml": "/feed.xml",
    },
  },
  openGraph: {
    type: "website",
    siteName: "MiziziNodes",
    title: "MiziziNodes — AI Research & Analysis",
    description: "In-depth AI research, LLM comparisons, agent tutorials, and original analysis of the AI landscape.",
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MiziziNodes",
    description: "In-depth AI research, LLM comparisons, agent tutorials, and original analysis.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="application/atom+xml" href="/feed.xml" title="MiziziNodes" />
        <link rel="canonical" href={siteUrl} />
        <Script id="theme-script" strategy="beforeInteractive">
          {`
            (function() {
              var theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              }
            })();
          `}
        </Script>
        <AdSenseScript />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-CYN1EK2RBS" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CYN1EK2RBS');
          `}
        </Script>
        {process.env.NEXT_PUBLIC_GSC_ID && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_ID} />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 transition-colors duration-300">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
