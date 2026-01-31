import type { Metadata } from "next";
import "./globals.scss";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "Station Finder & Trip Planner",
  description: "Find stations across Australia, plan trips, and filter by amenities.",
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
