import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#d6e8ff",
          200: "#b0d1ff",
          300: "#7fb1ff",
          400: "#4d8eff",
          500: "#2563eb",
          600: "#1b4ecd",
          700: "#1640a3",
          800: "#143688",
          900: "#122f72",
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-slow": "pulse-slow 4s ease-in-out infinite",
      },
      boxShadow: {
        soft: "0 20px 45px -20px rgba(37, 99, 235, 0.45)",
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(37, 99, 235, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(37, 99, 235, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [forms],
};

export default config;
