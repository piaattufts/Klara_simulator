/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Palatino", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
