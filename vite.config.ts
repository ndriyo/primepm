import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import type { Connect } from 'vite';

const APP_ROUTES = [
  '/login',
  '/dashboard',
  '/dashboard-soon',
  '/projects',
  '/selection',
  '/ongoing-soon',
  '/soon',
];

function appRouteMiddleware(): {
  name: string;
  configureServer(server: { middlewares: { use: (fn: Connect.NextHandleFunction) => void } }): void;
} {
  return {
    name: 'app-route-rewrite',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? '/';
        const path = url.split('?')[0];
        if (
          APP_ROUTES.some(r => path === r || path.startsWith(r + '/')) ||
          /^\/p\/[0-9a-f-]{36}/i.test(path)
        ) {
          req.url = '/app.html' + (url.includes('?') ? '?' + url.split('?')[1] : '');
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), appRouteMiddleware()],
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app.html'),
        landing: resolve(__dirname, 'index.html'),
      },
    },
  },
});
