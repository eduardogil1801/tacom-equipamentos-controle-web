import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configuração importante para Electron
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Otimizações para Electron
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      // Manter algumas dependências como external se necessário
      external: ['electron'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs']
        }
      }
    }
  },
  server: {
    port: 5173,        // Força a porta 5173
    strictPort: true,  // Falha se a porta não estiver disponível
    host: true,        // Permite conexões externas
    cors: true
  },
  // Otimizações para desenvolvimento
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs'
    ]
  },
  // Configurações específicas para produção
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    __IS_ELECTRON__: true
  }
})