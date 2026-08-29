/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Base paper & ink — warm ledger-paper surface instead of clinical white/slate.
        paper: '#FBF6EA',
        ink: '#211A12',

        // Primary brand — "ledger indigo", the deep blue-teal of an official stamp,
        // replacing the generic bright-green SaaS default.
        agri: {
          50: '#EFF4F2',
          100: '#DCE8E4',
          200: '#B9D1C9',
          300: '#8EB4A9',
          400: '#5E9086',
          500: '#2F6E63',
          600: '#24564D',
          700: '#1C443D',
          800: '#15332E',
          900: '#0F2521',
          950: '#081511',
        },

        // Accent — turmeric gold (Nizamabad turmeric is one of the crops on the
        // platform), overriding Tailwind's default amber so every amber-* class
        // in the app inherits it automatically.
        amber: {
          50: '#FFF8E7',
          100: '#FEEBBE',
          200: '#FCD983',
          300: '#F9C34D',
          400: '#EFA824',
          500: '#D6900F',
          600: '#AD730B',
          700: '#855709',
          800: '#654208',
          900: '#452D06',
          950: '#2B1C04',
        },

        // Success / "open" state — muted paddy green, overriding default emerald.
        emerald: {
          50: '#F1F7EC',
          100: '#DFEDD1',
          200: '#BEDBA7',
          300: '#97C378',
          400: '#71A64F',
          500: '#558A36',
          600: '#436E2A',
          700: '#345521',
          800: '#274018',
          900: '#1B2C10',
          950: '#0F1A09',
        },

        // Neutral text/border scale — warm stone instead of cool clinical slate,
        // overriding default slate so every slate-* class already in the app
        // inherits it automatically.
        slate: {
          50: '#FAF7F0',
          100: '#F2EDE1',
          200: '#E4DCC8',
          300: '#CBBFA3',
          400: '#A79876',
          500: '#85745B',
          600: '#685A45',
          700: '#4F4433',
          800: '#372F23',
          900: '#251F17',
          950: '#17130D',
        },

        // Terracotta — reserved for danger / urgent alerts (unglazed clay pot red).
        clay: {
          50: '#FDF1EC',
          100: '#FADCCE',
          200: '#F3B79D',
          300: '#E7906D',
          400: '#D06B45',
          500: '#BD4F2E',
          600: '#993D22',
          700: '#78301B',
          800: '#5A2415',
          900: '#3D180E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Telugu', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Noto Sans Telugu', 'Noto Sans Devanagari', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(33, 26, 18, 0.06)',
        card: '0 1px 2px rgba(33,26,18,0.04), 0 8px 24px -12px rgba(33,26,18,0.18)',
        stamp: '0 2px 8px -2px rgba(33,26,18,0.25)',
        lifted: '0 20px 40px -18px rgba(33,26,18,0.35)',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce 2s infinite',
        'stamp-in': 'stampIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        stampIn: {
          '0%': { opacity: '0', transform: 'scale(1.6) rotate(-14deg)' },
          '60%': { opacity: '1', transform: 'scale(0.94) rotate(-8deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-8deg)' },
        },
      },
    },
  },
  plugins: [],
}
