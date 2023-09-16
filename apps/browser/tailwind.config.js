const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.{html,css}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Exo", ...defaultTheme.fontFamily.sans],
        mono: ["Source Code Pro", ...defaultTheme.fontFamily.mono]
      },
      animation: {
        "landing-bg": "landing-bg 5s linear infinite"
      },
      keyframes: {
        "landing-bg": {
          "100%": {
            "background-position": "0 250px"
          }
        }
      },
      backgroundImage: {
        "landing-bg": `url('/public/wallpaper.png')`
      },
      backgroundSize: {
        "landing-bg": `461px 250px`
      }
    },
  },
  plugins: [],
}