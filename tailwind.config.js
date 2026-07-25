/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // This overrides Tailwind's default font to your premium font
        sans: ['"Inter"', 'sans-serif'],
        
        display: ['"Space Grotesk"', 'sans-serif'], 
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // <-- ADDED TYPOGRAPHY PLUGIN HERE
  ],
}