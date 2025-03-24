/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cream': '#7693cc',
        'code-bg': '#1e1e1e',
        'code-text': '#f8f8f2',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Monaco', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}