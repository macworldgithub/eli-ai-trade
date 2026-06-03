/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        heading: ['Chivo', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        bullish: "#10B981",
        bearish: "#EF4444",
        warning: "#EAB308",
        surface: "#121215",
        "surface-elevated": "#1A1A1F",
        "eli-navy": "rgba(var(--eli-navy), <alpha-value>)",
        "eli-navy-2": "rgba(var(--eli-navy-2), <alpha-value>)",
        "eli-navy-3": "rgba(var(--eli-navy-3), <alpha-value>)",
        "eli-navy-4": "rgba(var(--eli-navy-4), <alpha-value>)",
        "eli-navy-5": "var(--eli-navy-5)",
        "eli-border": "rgba(var(--eli-border), <alpha-value>)",
        "eli-gold": "rgba(var(--eli-gold), <alpha-value>)",
        "eli-gold-bright": "rgba(var(--eli-gold-bright), <alpha-value>)",
        "eli-muted": "rgba(var(--eli-muted), <alpha-value>)",
        "eli-muted-light": "rgba(var(--eli-muted-light), <alpha-value>)",
        "eli-tooltip": "var(--eli-tooltip)",
        "eli-slate-300": "var(--eli-slate-300)",
        "eli-slate-900": "var(--eli-slate-900)",
        "eli-text-white": "var(--eli-text-white)",
        "eli-overlay-5": "var(--eli-overlay-5)",
        "eli-overlay-10": "var(--eli-overlay-10)",
        "eli-overlay-20": "var(--eli-overlay-20)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
