/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0b0d12",
        panel: "#12151c",
        border: "#242833",
        accent: "#7c5cff",
        accent2: "#5cf0d0",
      },
      fontFamily: {
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124,92,255,0.35)",
      },
    },
  },
  plugins: [],
};
