// Empty PostCSS config — Tailwind CSS v4 is handled by the @tailwindcss/vite plugin,
// not via PostCSS. This file exists to prevent parent-directory postcss.config files
// (which may reference Tailwind v3) from being picked up by PostCSS.
export default {
  plugins: {},
}
