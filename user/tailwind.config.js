/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Blue
          light: '#DBEAFE',
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#14B8A6', // Teal
          light: '#CCFBF1',
          dark: '#0F766E',
        },
        cardBg: '#F8FAFC', // Slate 50
        success: '#22C55E', // Green
        warning: '#F97316', // Orange
        danger: '#EF4444', // Red
      },
    },
  },
  plugins: [],
}
