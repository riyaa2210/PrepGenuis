/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
  // We use CSS custom properties for design tokens — Tailwind is used for utilities only
  corePlugins: {
    preflight: true,
  },
};
