import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Tối ưu Fast Refresh: chỉ reload component thay đổi
      jsxRuntime: 'automatic',
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react', '@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-os', '@tauri-apps/plugin-window'], // tránh prebundle các icon nặng
    include: ['react', 'react-dom'], // force prebundle core libs
  },
  server: {
    fs: {
      strict: false, // nếu bạn import assets ngoài root
    },
  },
  esbuild: {
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    target: 'esnext', // tăng tốc dev
  },
  build: {
    target: 'esnext',
    sourcemap: true, // nếu cần debug
  },
});
