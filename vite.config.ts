import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',  // MOST IMPORTANT - binds to all network interfaces
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws'
    },
    allowedHosts: [
      '.trycloudflare.com',  // Allows ALL Cloudflare tunnel domains
      'localhost'
    ]
  }
})