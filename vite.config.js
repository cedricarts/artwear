import { defineConfig } from "vite";
import react           from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // Keep original class names in the generated hash even in
      // production builds. Without this, Vite's default prod scoped
      // name is a bare hash — which silently breaks any CSS relying
      // on `[class*="Btn"]` / `[class*="btn"]` attribute selectors
      // (see global.css's neumorphic button fallback), since those
      // untouched buttons would stop matching after a build.
      generateScopedName: "[name]__[local]___[hash:base64:5]",
    },
  },
});
