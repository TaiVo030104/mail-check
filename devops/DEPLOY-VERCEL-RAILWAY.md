# Deploy: Vercel (frontend) + Railway (backend) + MongoDB Atlas

```
Browser ──► Vercel (frontend, Vite SPA)
   │
   └──────► Railway (backend NestJS, Docker, 1 replica, always-on)
                 ├──► MongoDB Atlas
                 ├──► AWS S3 (attachments, optional)
                 └──► Gmail API / IMAP / SMTP
```

Backend chạy trên Railway (không phải serverless) vì có `@Cron` mỗi phút (IMAP sync, snooze, token refresh)
và kết nối IMAP dài. **Giữ đúng 1 replica**, nếu scale lên N thì mỗi cron chạy N lần.

## 1. MongoDB Atlas

1. Tạo cluster M0 (free), chọn region gần region của Railway (ví dụ Singapore).
2. Database Access: tạo user/password.
3. Network Access: thêm `0.0.0.0/0` (Railway không có IP tĩnh ở gói thường).
4. Lấy connection string: `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net`

## 2. Backend trên Railway

1. New Project → Deploy from GitHub repo → `TaiVo030104/mail-check`, branch `main`.
2. Service → Settings (vì đây là monorepo):
   - **Source → Root Directory**: `/backend`
   - **Config-as-code → Railway Config File**: `/backend/railway.json` (file config không tự theo Root Directory)
   - **Source → Watch Paths**: `/backend/**` (chỉ redeploy khi backend thay đổi)

   Railway đọc `railway.json`: build bằng `Dockerfile`, healthcheck `/health`, 1 replica.
3. Settings → Networking → **Generate Domain** (ví dụ `mailcheck-api.up.railway.app`).
4. Variables (Railway tự set `PORT`, không cần thêm):

| Biến | Giá trị |
|---|---|
| `NODE_ENV` | `production` |
| `MONGO_URI` | connection string Atlas |
| `MONGO_DB` | `email_system` |
| `JWT_SECRET` | chuỗi ngẫu nhiên ≥ 32 ký tự (`openssl rand -hex 32`) |
| `FRONTEND_URL` | `https://<app>.vercel.app` |
| `CORS_ORIGIN` | `https://<app>.vercel.app` (nhiều origin thì phân cách bằng dấu phẩy) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | từ Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://<backend>.up.railway.app/auth/google/callback` |
| `USE_COOKIE_AUTH` | `true` hoặc `false` (phải khớp với `VITE_USE_COOKIE_AUTH` ở frontend) |
| `COOKIE_SAME_SITE` | `none` khi frontend và backend khác domain gốc (`*.vercel.app` và `*.up.railway.app`) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP hệ thống (tuỳ chọn) |
| `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASSWORD`, `IMAP_TLS` | tuỳ chọn |
| `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` | tuỳ chọn, nếu thiếu thì attachment lưu trong DB |
| `GEMINI_API_KEY` | tuỳ chọn, nếu thiếu thì tắt tính năng AI |
| `GMAIL_PUBSUB_TOPIC` | tuỳ chọn (Gmail push notifications) |

5. Kiểm tra: `curl https://<backend>.up.railway.app/health`

## 3. Frontend trên Vercel

1. Add New Project → import `TaiVo030104/mail-check`, **Root Directory: `frontend`**. `frontend/vercel.json` đã cấu hình sẵn
   framework Vite, pnpm, SPA rewrite và cache header cho `sw.js`.
2. Environment Variables (Vite nhúng các biến này lúc build, nên **phải redeploy sau khi đổi**):

| Biến | Giá trị |
|---|---|
| `VITE_API_BASE_URL` | `https://<backend>.up.railway.app` |
| `VITE_USE_COOKIE_AUTH` | giống `USE_COOKIE_AUTH` ở backend |
| `VITE_ENABLE_GOOGLE_AUTH` | `true` |

3. Sau khi deploy xong, quay lại Railway và cập nhật `FRONTEND_URL` / `CORS_ORIGIN` bằng domain Vercel thật.

## 4. Google Cloud Console

APIs & Services → Credentials → OAuth client:
- **Authorized JavaScript origins**: `https://<app>.vercel.app`
- **Authorized redirect URIs**: `https://<backend>.up.railway.app/auth/google/callback`
- OAuth consent screen: thêm domain vào Authorized domains. Nếu app đang ở chế độ Testing thì thêm test users.

## 5. Custom domain (tuỳ chọn)

- Vercel: `mail.<domain>` → CNAME `cname.vercel-dns.com`
- Railway: `api.mail.<domain>` → CNAME theo giá trị Railway cung cấp
- Khi cả hai cùng domain gốc thì là same-site, nên có thể để `COOKIE_SAME_SITE=lax`.
- Nhớ cập nhật lại `FRONTEND_URL`, `CORS_ORIGIN`, `GOOGLE_CALLBACK_URL`, `VITE_API_BASE_URL` và Google Console.

## 6. Preview / dev

- Vercel tự tạo preview deploy cho mỗi branch và PR. Preview dùng domain khác nên cần
  thêm domain đó vào `CORS_ORIGIN`, hoặc trỏ preview vào backend dev.
- Railway: tạo thêm environment `dev` (Project → Environments), gắn branch `dev`.

## Thư mục `ansible/`

Không còn dùng khi chạy Vercel + Railway. Giữ lại nếu muốn quay về deploy lên VPS.
