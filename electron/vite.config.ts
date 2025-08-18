import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            lib: { entry: 'src/main/index.ts', fileName: 'main', formats: ['cjs'] },
            outDir: 'dist-electron',
          },
        },
      },
      preload: {
        input: { preload: 'src/preload/index.ts' },
        vite: { build: { outDir: 'dist-electron' } },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src/renderer', import.meta.url)),
    },
  },
  build: { outDir: 'dist' },
})
