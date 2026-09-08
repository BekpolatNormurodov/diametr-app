/** @type {import('tailwindcss').Config} */


module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#00C48C",
        "primary-light": "#33D3A3",
        secondary: "#D1FAF0",
        textColor: "#0F172A",
        textGrey: "#64748B",
        accent: "#00A876",
        dark: "#0F172A",
        light: "#F8FAFC",
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
