/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"], // Allows dark mode based on class
  content: [
    './pages/**/*.{ts,tsx,jsx}', // Ensures Tailwind scans these directories
    './components/**/*.{ts,tsx,jsx}',
    './app/**/*.{ts,tsx,jsx}',
    './src/**/*.{ts,tsx,jsx}',
  ],
  prefix: "", // No prefix added to classes
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px", // Custom container width for 2XL screens
      },
    },
    extend: {
      borderRadius: {
        lg: "0.5rem", // Temporarily set a fixed value
        md: "0.375rem", // Temporarily set a fixed value
        sm: "0.25rem", // Temporarily set a fixed value
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
  plugins: [require("tailwindcss-animate")], // Include any required plugins here
}
