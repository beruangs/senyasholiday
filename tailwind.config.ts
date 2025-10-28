import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6b6b',
          500: '#ff3838',
          600: '#ed1515',
          700: '#c80d0d',
          800: '#a50f0f',
          900: '#881414',
          950: '#4a0505',
        },
        secondary: {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fcfcfc',
          300: '#f9f9f9',
          400: '#f5f5f5',
          500: '#f0f0f0',
          600: '#d4d4d4',
          700: '#b8b8b8',
          800: '#9c9c9c',
          900: '#808080',
        },
      },
    },
  },
  plugins: [],
}
export default config
