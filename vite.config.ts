import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Serve src/assets as the public root so asset/ font/ paths work at runtime
  publicDir: 'src/assets',
})
