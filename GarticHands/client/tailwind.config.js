/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        baloo: ['Baloo 2', 'cursive'],
      },
      colors: {
        // Brand teals — backgrounds and surface tones
        teal: {
          50:  '#C8DDD9',  // empty-slot text
          100: '#8EBAB3',  // light teal (inner)
          200: '#9CC9C1',  // disabled green bg
          300: '#79A8A0',  // mid teal (player row)
          400: '#6FADA0',  // primary page background
          500: '#5E9990',  // card background
          600: '#559490',  // card background (alt)
          700: '#47756E',  // disabled green text
          800: '#3D7A72',  // top-right icon
          850: '#3D6B64',  // dark teal text
          900: '#2A5E58',  // top-right hover
          950: '#2F4542',  // avatar shell + toast bg
        },
        // Action accents — host & action colors
        coral: {
          DEFAULT: '#D4623E',  // primary orange / host highlight
          400:     '#E67B2E',  // avatar inner
        },
        // Player ready / start-button greens
        grass: {
          400: '#78EF57',  // ready border / start
          500: '#67DD48',  // start hover
          700: '#2E5534',  // ready text / host button
          800: '#244529',  // host hover
        },
      },
    },
  },
  plugins: [],
}
