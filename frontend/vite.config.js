import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const reactAppEnv = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("REACT_APP_"))
      .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
  );

  return {
    plugins: [react()],
    define: reactAppEnv,
    esbuild: {
      loader: "jsx",
      include: /src\/.*\.jsx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          ".js": "jsx",
        },
      },
    },
    server: {
      // Dev server stays on Vite's default port 5173. Google OAuth client
      // selection is origin-aware in GoogleSignInButton.js: on port 5173 the
      // frontend uses GOOGLE_CLIENT_ID_ALT (which has 5173 registered as an
      // authorized JavaScript origin).
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  };
});
