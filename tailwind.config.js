/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        urlaub: {
          primary: '#2563eb',
          secondary: '#0ea5e9',
          accent: '#60a5fa',
          neutral: '#1f2937',
          'base-100': '#ffffff',
          'base-200': '#f3f6fb',
          'base-300': '#e6ecf6',
          info: '#3b82f6',
          success: '#16a34a',
          warning: '#f59e0b',
          error: '#ef4444',
        },
      },
      'light',
    ],
  },
}
