import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Preset tự nhận diện qua biến môi trường để cùng 1 source build được nhiều nơi:
// - Vercel  → preset "vercel"          (Serverless Functions, hỗ trợ server fn)
// - Netlify → preset "netlify"         (Netlify Functions)
// - Lovable / Cloudflare Workers → "cloudflare-module" (mặc định Lovable dùng)
// - Khác    → "node-server"            (chạy Node thường, tương thích rộng)
//
// LƯU Ý: KHÔNG dùng preset "static" vì dự án có Server Functions
// (createServerFn) để cộng điểm / lưu khách hàng — cần server runtime,
// nếu build static thì mọi API ghi DB sẽ trả 404/405 trên bên thứ ba.
const preset =
  process.env.VERCEL ? "vercel" :
  process.env.NETLIFY ? "netlify" :
  process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS ? "cloudflare-module" :
  process.env.LOVABLE_BUILD_PRESET ?? "node-server";

export default defineConfig({
  tanstackStart: {
    server: { preset },
  },
});
