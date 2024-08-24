import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    visualizer({ open: true })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // return id.toString().split('node_modules/')[1].split('/')[0].toString();
            if (id.includes('three')) {
              return 'three';
            }
            if (id.includes('firebase/database')) {
              return 'firebase/database';
            }
            if (id.includes('firebase/firestore')) {
              return 'firebase/firestore';
            }
            if (id.includes('firebase')) {
              return 'firebase';
            }
            return 'vendor';
          }
        },
      },
    },
    // commonjsOptions: {
    //   include: [/node_modules/], // Include all node_modules for commonjs to esm conversion
    // },
    target: ['chrome90', 'edge90', 'firefox90', 'safari15']
  },
  
});
