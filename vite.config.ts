import { defineConfig } from 'vite'
import build from '@hono/vite-build/vercel'
import devServer from '@hono/vite-dev-server'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  if (mode === 'client') {
    return {
      plugins: [react()],
      publicDir: false,
      build: {
        emptyOutDir: false,
        copyPublicDir: false,
        rollupOptions: {
          input: 'src/client/main.tsx',
          output: {
            assetFileNames: 'static/assets/[name][extname]',
            chunkFileNames: 'static/assets/[name]-[hash].js',
            entryFileNames: 'static/client.js',
            dir: 'public',
          },
        },
      },
    }
  }

  return {
    plugins: [
      command === 'serve'
        ? devServer({ entry: 'src/index.ts' })
        : build({ entry: 'src/index.ts' }),
    ],
  }
})
