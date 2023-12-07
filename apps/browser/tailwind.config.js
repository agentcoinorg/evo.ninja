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
        sans: ["Ubuntu", ...defaultTheme.fontFamily.sans],
        mono: ["Fira Mono", ...defaultTheme.fontFamily.mono]
      },
      backgroundSize: {
        "landing-bg": `461px 250px`,
        button: '100% 200%'
      },
      colors: {
        'opacity-black': 'hsla(0, 0%, 9%, 0.8)',
        current: 'currentColor'
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            pre: {
              "background-color": theme('colors.zinc.900')
            }
          }
        }
      }),
      animation: {
        'fade-in': 'fade 300ms ease-in-out forwards',
        'fade-out': 'fade 300ms ease-in-out reverse forwards',
        'slide-down': 'slide-down 500ms ease-in-out forwards'
      },
      keyframes: {
        'fade': {
          "0%": { opacity: 0 },
          "100%": {opacity: 1 }
        },
        'slide-down': {
          "0%": { transform: 'translateY(-10%)', opacity: 0 },
          "100%": { transform: 'translateY(0%)', opacity: 1 }
        },
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}