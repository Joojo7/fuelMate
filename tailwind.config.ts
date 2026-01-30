import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bp: {
          green: "#009b3a",
          yellow: "#ffd700",
          dark: "#1a1a2e",
          light: "#f0f4f8",
        },
      },
    },
  },
  plugins: [],
};
export default config;
