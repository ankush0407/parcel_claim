/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maersk: {
          navy:    '#00243D',
          blue:    '#0073AB',
          sky:     '#42B0D5',
          light:   '#E8F4F8',
          pale:    '#F0F7FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
