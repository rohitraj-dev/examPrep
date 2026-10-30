import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Footer from "@/components/Footer";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
