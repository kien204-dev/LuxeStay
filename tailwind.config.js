/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./front-end/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#818CF8",

        "background-light": "#F9FAFB",
        "background-dark": "#0B0E14",

        "card-dark": "#161B26",
        "border-dark": "#2D3748",
      },
      fontFamily: {
        headline: ["Noto Serif", "serif"],
        body: ["Manrope", "sans-serif"],
        label: ["Manrope", "sans-serif"],
        sans: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};
