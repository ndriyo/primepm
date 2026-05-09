import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Test runner configuration.
 *
 * Coverage target: 90% on lines/statements/functions for the focused
 * "core" surface — pure logic in lib/, engine/, store/, api/, plus
 * the reusable UI building blocks. Page shells, layout chrome, drag
 * interaction hooks (heavy DOM) and auth/Supabase wiring are excluded
 * from coverage but still importable in tests.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'src/engine/__tests__/perf.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/engine/**/*.ts',
        'src/store/**/*.ts',
        'src/api/**/*.ts',
        'src/components/ui/**/*.{ts,tsx}',
        'src/components/gantt/timeScale.ts',
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/lib/router.ts',
        'src/lib/theme.ts',
        'src/lib/useResize.ts',
        'src/store/persistence.ts',
        'src/api/types.ts',
        'src/engine/types.ts',
        'src/engine/index.ts',
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 80,
      },
    },
  },
});
