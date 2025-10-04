import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  publicDir: 'src/public',
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        search: path.resolve(__dirname, 'search.html'),
        detail: path.resolve(__dirname, 'detail.html'),
        favorites: path.resolve(__dirname, 'favorites.html'),
        shopping: path.resolve(__dirname, 'shopping-list.html'),
       
      }
    }
  }
});
