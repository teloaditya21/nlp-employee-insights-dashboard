import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    root: path.resolve(__dirname, 'client'),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './client/src')
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8787',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      sourcemap: mode === 'development',
      minify: mode === 'production',
    },
    define: {
      // Make environment variables available at build time
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    }
  };
});
