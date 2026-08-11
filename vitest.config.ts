import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-vitest.ts'],
    include: ['tests/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './fe/src'),
      '@models': path.resolve(__dirname, './fe/src/app/models'),
      '@services': path.resolve(__dirname, './fe/src/app/services'),
      '@shared': path.resolve(__dirname, './fe/src/app/shared'),
      '@guards': path.resolve(__dirname, './fe/src/app/guards'),
      '@admin': path.resolve(__dirname, './fe/src/app/pages/admin'),
      '@auth': path.resolve(__dirname, './fe/src/app/pages/auth'),
      '@client': path.resolve(__dirname, './fe/src/app/pages/client'),
    },
  },
});
