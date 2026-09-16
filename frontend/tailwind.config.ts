import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        esprit: {
          red: "#E2001A",
          "red-dark": "#B50015",
          black: "#121212",
          gray: "#9CA3A6",
          "gray-light": "#D8D8D8",
          white: "#FFFFFF",
          offwhite: "#F6F5F4",
          charcoal: "#1E1E1E",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-ibm-plex)", "sans-serif"],
      },
      clipPath: {
        "cut-tr": "polygon(0 0, 100% 0, 100% 75%, 75% 100%, 0 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
