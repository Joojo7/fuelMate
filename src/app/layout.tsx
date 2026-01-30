import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "FuelMate AU — BP Station Finder & Trip Planner",
  description: "Find BP stations across Australia, plan trips, and filter by amenities.",
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
      <body className="bg-gray-50">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
