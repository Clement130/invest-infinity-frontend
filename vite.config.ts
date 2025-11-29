import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Invest Infinity',
        short_name: 'InvestInfinity',
        description: 'Plateforme de trading éducative',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB pour les gros fichiers
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif}'],
        // Exclure les gros fichiers d'arrière-plan du cache
        globIgnores: ['**/background.png', '**/video_background.mp4'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://api.supabase.co',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // UI libraries
            if (id.includes('@mui') || id.includes('@emotion') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            // Data fetching
            if (id.includes('@tanstack/react-query') || id.includes('@supabase')) {
              return 'data-vendor';
            }
            // Icons
            if (id.includes('lucide-react') || id.includes('@dnd-kit')) {
              return 'icons-vendor';
            }
            // Forms and validation
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('yup')) {
              return 'forms-vendor';
            }
            // Charts and heavy components
            if (id.includes('recharts') || id.includes('chart.js') || id.includes('react-window')) {
              return 'charts-vendor';
            }
            // Utils and helpers
            if (id.includes('clsx') || id.includes('date-fns') || id.includes('lodash')) {
              return 'utils-vendor';
            }
            // HTTP clients
            if (id.includes('axios') || id.includes('ky') || id.includes('swr')) {
              return 'http-vendor';
            }
          }

          // Application chunks
          if (id.includes('src/pages/admin')) {
            return 'admin-pages';
          }
          if (id.includes('src/components/admin')) {
            return 'admin-components';
          }
          if (id.includes('src/components/training')) {
            return 'training-components';
          }
          if (id.includes('src/components/member')) {
            return 'member-components';
          }
          if (id.includes('src/services')) {
            return 'services';
          }
          if (id.includes('src/hooks')) {
            return 'hooks';
          }
        },
        // Optimiser pour mobile - plus petits chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimisations pour mobile
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    // Compression
    reportCompressedSize: false, // Désactiver pour build plus rapide
    sourcemap: false, // Désactiver sourcemaps en prod pour taille
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
