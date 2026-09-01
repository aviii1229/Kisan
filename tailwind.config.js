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
        sage: '#b5d6cc',

        // Primary brand — "ledger indigo", deep blue-teal of an official stamp.
        agri: {
          50: '#EFF4F2',
          100: '#DCE8E4',
          200: '#b5d6cc',
          300: '#8EB4A9',
          400: '#5E9086',
          500: '#2F6E63',
          600: '#24564D',
          700: '#1C443D',
          800: '#15332E',
          900: '#0F2521',
          950: '#081511',
        },

        // Accent — turmeric gold (Nizamabad turmeric).
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

        // Success / "open" state — muted paddy green.
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

        // Neutral text/border scale — warm stone.
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

        // High-contrast semantic status tokens (WCAG AA compliant)
        status: {
          open: {
            bg: '#DFEDD1',
            text: '#1B2C10',
            border: '#97C378',
          },
          closed: {
            bg: '#FADCCE',
            text: '#3D180E',
            border: '#E7906D',
          },
          break: {
            bg: '#FEEBBE',
            text: '#2B1C04',
            border: '#F9C34D',
          },
          quota: {
            bg: '#DCE8E4',
            text: '#081511',
            border: '#8EB4A9',
          },
        },
      },
      borderRadius: {
        chip: '0.5rem',     // 8px
        badge: '9999px',   // pill
        input: '0.75rem',   // 12px
        btn: '0.75rem',     // 12px
        card: '1.25rem',    // 20px
        modal: '1.5rem',    // 24px
      },
      fontSize: {
        'display-lg': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '800' }],
        'display-md': ['1.75rem', { lineHeight: '2.125rem', fontWeight: '700' }],
        'heading-lg': ['1.375rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        'heading-md': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '700' }],
        'body-lg': ['1.125rem', { lineHeight: '1.625rem', fontWeight: '500' }],
        'body-base': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }], // Min 16px for outdoor readability
        'caption-sm': ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '600' }],
        'micro': ['0.6875rem', { lineHeight: '0.875rem', fontWeight: '700' }],
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'Inter', 'Noto Sans Telugu', 'Noto Sans Devanagari', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'Outfit', 'Noto Sans Telugu', 'Noto Sans Devanagari', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(33, 26, 18, 0.06)',
        paper: '0 1px 2px rgba(33,26,18,0.04)',
        card: '0 2px 8px -2px rgba(33,26,18,0.08), 0 12px 32px -16px rgba(33,26,18,0.16)',
        'card-hover': '0 8px 30px -6px rgba(36, 86, 77, 0.22), 0 4px 12px -2px rgba(33,26,18,0.1)',
        glow: '0 0 25px -5px rgba(36, 86, 77, 0.35)',
        'glow-amber': '0 0 25px -5px rgba(214, 144, 15, 0.4)',
        stamp: '0 2px 8px -2px rgba(33,26,18,0.25)',
        lifted: '0 24px 48px -18px rgba(15, 37, 33, 0.45)',
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
        'gradient-field': 'linear-gradient(135deg, #1C443D 0%, #15332E 50%, #0F2521 100%)',
        'gradient-harvest': 'linear-gradient(135deg, #855709 0%, #654208 50%, #452D06 100%)',
        'gradient-dusk': 'linear-gradient(135deg, #15332E 0%, #251F17 50%, #452D06 100%)',
        'gradient-app-shell': 'radial-gradient(ellipse at 50% -10%, rgba(47, 110, 99, 0.08) 0%, rgba(251, 246, 234, 0.98) 55%, rgba(214, 144, 15, 0.05) 100%)',
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
