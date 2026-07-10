/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          glow: "var(--primary-glow)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
          glow: "var(--secondary-glow)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
          hover: "var(--card-hover)",
        },
      },
      borderRadius: {
        // Escala Papel (DESIGN.md "Radius"): 6px inputs/botones, 8px cards,
        // 10px paneles grandes. 999px (pills/badges) ya lo cubre `rounded-full`.
        sm: "6px",
        md: "8px",
        lg: "10px",
      },
      fontFamily: {
        // Fraunces = títulos/wordmark, Work Sans = cuerpo/UI, IBM Plex Mono =
        // todos los valores numéricos/fechas/tags (ver DESIGN.md "Typography").
        serif: [
          'Fraunces',
          'ui-serif',
          'Georgia',
          'serif'
        ],
        sans: [
          'Work Sans',
          'Inter',
          'ui-sans-serif',
          'system-ui'
        ],
        mono: [
          'IBM Plex Mono',
          'ui-monospace',
          'SFMono-Regular',
          'monospace'
        ]
      },
      boxShadow: {
        // Sin sombra decorativa en el tema Papel — la profundidad se logra
        // solo con bordes y contraste de fondo. Se dejan definidos por si
        // algún componente aún no restyleado los referencia, pero no se
        // deben aplicar en código nuevo.
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require("tailwindcss-animate"),
  ],
}