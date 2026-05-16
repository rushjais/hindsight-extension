import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'text-secondary': 'hsl(var(--text-secondary))',
        'text-muted': 'hsl(var(--text-muted))',
        'text-disabled': 'hsl(var(--text-disabled))',
        'surface-sunken': 'hsl(var(--surface-sunken))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        verdict: {
          green: {
            DEFAULT: 'hsl(var(--verdict-green-bg))',
            foreground: 'hsl(var(--verdict-green-fg))',
            border: 'hsl(var(--verdict-green-border))',
          },
          amber: {
            DEFAULT: 'hsl(var(--verdict-amber-bg))',
            foreground: 'hsl(var(--verdict-amber-fg))',
            border: 'hsl(var(--verdict-amber-border))',
          },
          red: {
            DEFAULT: 'hsl(var(--verdict-red-bg))',
            foreground: 'hsl(var(--verdict-red-fg))',
            border: 'hsl(var(--verdict-red-border))',
          },
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 2px)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
      },
      fontFamily: {
        sans: [
          "'Inter Variable'",
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          "'Segoe UI'",
          'sans-serif',
        ],
        mono: [
          "'Geist Mono Variable'",
          "'Geist Mono'",
          'ui-monospace',
          "'SF Mono'",
          'Menlo',
          'monospace',
        ],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px', fontWeight: '500' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '22px', fontWeight: '500' }],
        lg: ['16px', { lineHeight: '24px', fontWeight: '600' }],
        xl: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        '2xl': ['28px', { lineHeight: '32px', fontWeight: '600' }],
        '3xl': [
          '44px',
          { lineHeight: '48px', fontWeight: '600', letterSpacing: '-0.02em' },
        ],
      },
      spacing: {
        '0.5': '2px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '100ms',
        base: '150ms',
        slow: '250ms',
      },
      screens: {
        wide: '480px',
      },
      keyframes: {
        'calibration-fill': {
          from: { width: '0%' },
          to: { width: 'var(--calibration-target, 0%)' },
        },
      },
      animation: {
        'calibration-fill':
          'calibration-fill 150ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [animate],
};

export default config;
