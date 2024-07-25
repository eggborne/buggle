import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    target: ['chrome90', 'edge90', 'firefox90', 'safari15']
  },
  resolve: {
    alias: {
      'context': '/src/context',
      'components': '/src/components',
      'scripts': '/src/scripts',
      'types': '/src/types'
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  }
});
