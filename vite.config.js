import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.', // raíz del proyecto
  publicDir: 'src/public', // si tienes imágenes estáticas o fuentes aquí
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Páginas principales
        main: path.resolve(__dirname, 'index.html'),
        detail: path.resolve(__dirname, 'detail.html'),
        search: path.resolve(__dirname, 'search.html'),
        favorites: path.resolve(__dirname, 'favorites.html'),
        shopping: path.resolve(__dirname, 'shopping-list.html'),
        categories_view: path.resolve(__dirname, 'categories-view.html'),
        info_recipies: path.resolve(__dirname, 'info-recipies.html'),
      },
      // Asegura que las rutas internas y las imágenes funcionen
      output: {
        assetFileNames: (assetInfo) => {
          if (/\.css$/i.test(assetInfo.name)) return 'assets/[name]-[hash][extname]';
          if (/\.(png|jpe?g|svg|webp|gif)$/i.test(assetInfo.name)) return 'img/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@api': path.resolve(__dirname, './api'),
      '@data': path.resolve(__dirname, './data'),
      '@img': path.resolve(__dirname, './img'),
      '@css': path.resolve(__dirname, './src/css'),
      '@js': path.resolve(__dirname, './src/js'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
