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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
