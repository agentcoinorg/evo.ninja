const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.{html,css}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Exo", ...defaultTheme.fontFamily.sans],
        mono: ["Source Code Pro", ...defaultTheme.fontFamily.mono]
      },
      backgroundSize: {
        "landing-bg": `461px 250px`
      },
      colors: {
        'opacity-black': 'hsla(0, 0%, 9%, 0.8)'
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}