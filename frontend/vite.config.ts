import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages のベースパス設定
  // リポジトリ名に合わせて変更してください
  base: process.env.NODE_ENV === 'production' ? '/MeshScope/' : '/',
  server: {
    port: 5173,
  },
})
