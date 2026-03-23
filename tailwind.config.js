/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1A237E',
          light:   '#283593',
          dark:    '#0D1457',
          50:      '#E8EAF6',
          100:     '#C5CAE9',
        },
        brand: {
          orange:      '#E65100',
          'orange-lt': '#FF6D00',
          'orange-bg': '#FFF3E0',
          teal:        '#00695C',
          'teal-bg':   '#E0F2F1',
          gold:        '#F57F17',
          ink:         '#1A1A2E',
        },
      },
      fontFamily: {
        sans: ['"Nunito Sans"', 'Calibri', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
