import { AppProvider } from "@/context/AppContext";
import type { Metadata, Viewport } from "next";
import "./globals.scss";

const SITE_TITLE = "Pitstop — Fuel Station Finder & Trip Planner";
const SITE_DESCRIPTION =
  "Find fuel stations across Australia, New Zealand, Malaysia, Ghana, and more. Filter by fuel type, amenities, and distance. Plan trips and discover nearby stops.";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Pitstop",
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL("https://pitstop.joojodontoh.tech"),
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Pitstop",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Pitstop — Fuel Station Finder" }],
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pitstop",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00ff41",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
