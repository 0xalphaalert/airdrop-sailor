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
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        
        // Optional: We can use Space Grotesk specifically for numbers or big headers if you want!
        display: ['"Space Grotesk"', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}