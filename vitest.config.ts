import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Framework de teste (built-in)
    globals: true,
    environment: 'node',

    // Setup files
    setupFiles: [],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Include/Exclude patterns
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.next'],

    // Isolação de testes
    isolate: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
