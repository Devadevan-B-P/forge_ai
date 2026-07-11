/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#050505",
        panel: "#12151c",
        border: "#242833",
        accent: "#7c5cff",
        accent2: "#5cf0d0",
        textSecondary: "#A0A0A0",
        glow: "#4F9DFF",
        accentBlue: "#7CEEFF",
        highlight: "#D8F3FF",
        orangeEnergy: "#FF7B39",
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124,92,255,0.35)",
      },
    },
  },
  plugins: [],
};
