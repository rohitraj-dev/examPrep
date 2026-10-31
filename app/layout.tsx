import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://examprep-gamma.vercel.app"),
  title: {
    default: "ExamPrep — BCA 3rd Semester PYQs & AI Practice Questions",
    template: "%s | ExamPrep",
  },
  description:
    "Practice BCA 3rd semester previous year question papers and AI-generated questions with ExamPrep.",
  appleWebApp: {
    capable: true,
    title: "ExamPrep",
  },
  openGraph: {
    type: "website",
    siteName: "ExamPrep",
    title: "ExamPrep — BCA 3rd Semester PYQs & AI Practice Questions",
    description:
      "Practice BCA 3rd semester previous year question papers and AI-generated questions with ExamPrep.",
    url: "https://examprep-gamma.vercel.app",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ExamPrep — BCA 3rd Semester PYQs & AI Practice Questions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ExamPrep — BCA 3rd Semester PYQs & AI Practice Questions",
    description:
      "Practice BCA 3rd semester previous year question papers and AI-generated questions with ExamPrep.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

const themeScript = `
  (() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      const theme =
        savedTheme === "light" || savedTheme === "dark" || savedTheme === "system"
          ? savedTheme
          : "system";
      const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    } catch {}
  })();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Header />
          {children}
          <Footer />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
