import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    base: '/tichdiem.trison/',
  },
  // Đổi TanStack sang chế độ đóng gói static phục vụ cho GitHub Pages
  tanstackStart: {
    server: { 
      preset: "static" 
    },
  },
});
