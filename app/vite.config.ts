import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/akmon-site/', // GitHub Pages: https://rafaelmkn.github.io/akmon-site/
  plugins: [react(), tailwindcss()],
})
