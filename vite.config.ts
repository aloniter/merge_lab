import { defineConfig } from 'vite'

export default defineConfig(({ command, mode }) => {
  // Use environment variable or default to root path
  // For GitHub Pages, set VITE_BASE_PATH=/merge_lab/ in workflow
  // For Vercel, it will use the default root path
  const base = process.env.VITE_BASE_PATH || '/'

  return {
    base,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    }
  }
})
