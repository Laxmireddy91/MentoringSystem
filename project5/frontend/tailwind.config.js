/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  darkMode: "class",

  safelist: [
    {
      pattern: /^(theme|bg-role|text-role|border-role|focus-role|bg-status|text-status|border-status)-/,
    },
  ],

  theme: {
    extend: {
      colors: {
        role: {
          DEFAULT: "var(--primary-color)",
          primary: "var(--primary-color)",
          dark: "var(--primary-dark)",
          soft: "var(--primary-soft)",
          "soft-dark": "var(--primary-soft-dark)",
          border: "var(--primary-border)",
          "text-light": "var(--primary-text-light)",
          "text-dark": "var(--primary-text-dark)",
        },

        roleColors: {
          student: "var(--role-student)",
          mentor: "var(--role-mentor)",
          coordinator: "var(--role-coordinator)",
          hod: "var(--role-hod)",
          exam: "var(--role-exam)",
          tpo: "var(--role-tpo)",
          parent: "var(--role-parent)",
        },

        textColorTokens: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
        },

        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },

        risk: {
          low: "#10b981",
          medium: "#f59e0b",
          high: "#f97316",
          critical: "#ef4444",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },

  plugins: [],
};
