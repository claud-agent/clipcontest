import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color — change this to your brand color
        brand: {
          50:  "#fff0f6",
          100: "#ffd6e8",
          200: "#ffadd2",
          300: "#ff85bc",
          400: "#f64f9e",
          500: "#e6007e", // <-- main brand color
          600: "#c4006b",
          700: "#9e0056",
          800: "#780041",
          900: "#52002d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
