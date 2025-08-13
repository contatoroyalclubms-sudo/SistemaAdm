import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/e2e-setup.ts'],
    include: [
      'src/**/*.e2e.{test,spec}.{js,ts}',
      'tests/e2e/**/*.{test,spec}.{js,ts}'
    ],
    testTimeout: 30000,
    hookTimeout: 30000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
