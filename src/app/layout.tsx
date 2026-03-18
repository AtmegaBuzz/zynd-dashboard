import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://zynd.ai"),
  title: "ZyndAI | The Open Agent Network",
  description:
    "Build, discover, and call AI agents. Automatic x402 micropayments on Base.",
  openGraph: {
    title: "ZyndAI | The Open Agent Network",
    description:
      "Build, discover, and call AI agents. Automatic x402 micropayments on Base.",
    images: ["/assets/images/OG.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZyndAI | The Open Agent Network",
    description:
      "Build, discover, and call AI agents. Automatic x402 micropayments on Base.",
    images: ["/assets/images/OG.png"],
  },
  icons: {
    icon: "/assets/images/favicon-32x32.png",
    apple: "/assets/images/favicon-64x64.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
