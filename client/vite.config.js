import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        // Dev only: proxy /api to Express on port 4000
        proxy: {
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
