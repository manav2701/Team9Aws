import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Shifa Teal
        primary: {
          DEFAULT: '#0F766E',
          dark: '#115E59',
          light: '#CCFBF1',
        },
        // Secondary
        navy: '#0F172A',
        slate: {
          DEFAULT: '#475569',
          muted: '#64748B',
        },
        // Backgrounds
        app: '#F8FAFC',
        card: '#FFFFFF',
        subtle: '#F1F5F9',
        // Borders
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
        },
        // Semantic
        success: {
          DEFAULT: '#16A34A',
          bg: '#DCFCE7',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FEF3C7',
        },
        emergency: {
          DEFAULT: '#DC2626',
          bg: '#FEE2E2',
        },
        info: {
          DEFAULT: '#2563EB',
          bg: '#DBEAFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['48px', { lineHeight: '56px', fontWeight: '700' }],
        h1: ['40px', { lineHeight: '48px', fontWeight: '700' }],
        h2: ['32px', { lineHeight: '40px', fontWeight: '700' }],
        h3: ['24px', { lineHeight: '32px', fontWeight: '600' }],
        h4: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        body: ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '80px',
        '6xl': '96px',
      },
      borderRadius: {
        sm: '8px',
        input: '10px',
        card: '12px',
        'card-lg': '16px',
        modal: '20px',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06)',
        elevated: '0 8px 24px rgba(15, 23, 42, 0.08)',
        modal: '0 20px 50px rgba(15, 23, 42, 0.15)',
      },
      maxWidth: {
        content: '1280px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};

export default config;
