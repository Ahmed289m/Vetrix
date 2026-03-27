import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          DEFAULT: "hsl(var(--surface))",
          raised: "hsl(var(--surface-raised))",
        },
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
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          50: "hsl(var(--emerald-50))",
          100: "hsl(var(--emerald-100))",
          200: "hsl(var(--emerald-200))",
          400: "hsl(var(--emerald-400))",
          500: "hsl(var(--emerald-500))",
          600: "hsl(var(--emerald-600))",
        },
        cyan: {
          DEFAULT: "hsl(var(--cyan))",
          50: "hsl(var(--cyan-50))",
          100: "hsl(var(--cyan-100))",
          400: "hsl(var(--cyan-400))",
          500: "hsl(var(--cyan-500))",
        },
        orange: {
          DEFAULT: "hsl(var(--orange))",
          50: "hsl(var(--orange-50))",
          100: "hsl(var(--orange-100))",
          400: "hsl(var(--orange-400))",
          500: "hsl(var(--orange-500))",
        },
        navy: {
          DEFAULT: "hsl(var(--navy))",
          50: "hsl(var(--navy-50))",
          100: "hsl(var(--navy-100))",
          200: "hsl(var(--navy-200))",
          300: "hsl(var(--navy-300))",
          700: "hsl(var(--navy-700))",
          800: "hsl(var(--navy-800))",
          900: "hsl(var(--navy-900))",
        },
        teal: {
          DEFAULT: "hsl(var(--teal))",
          50: "hsl(var(--teal-50))",
          100: "hsl(var(--teal-100))",
          500: "hsl(var(--teal-500))",
        },
        coral: {
          DEFAULT: "hsl(var(--coral))",
          50: "hsl(var(--coral-50))",
        },
        amber: {
          DEFAULT: "hsl(var(--amber))",
          50: "hsl(var(--amber-50))",
        },
        sky: {
          DEFAULT: "hsl(var(--sky))",
          50: "hsl(var(--sky-50))",
        },
        rose: {
          DEFAULT: "hsl(var(--rose))",
          50: "hsl(var(--rose-50))",
        },
        chat: {
          bg: "hsl(var(--chat-bg))",
          surface: "hsl(var(--chat-surface))",
          user: "hsl(var(--chat-user))",
          assistant: "hsl(var(--chat-assistant))",
          glow: "hsl(var(--chat-glow))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s cubic-bezier(0.2, 0, 0, 1)",
        "slide-up": "slide-up 0.4s cubic-bezier(0.2, 0, 0, 1)",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
