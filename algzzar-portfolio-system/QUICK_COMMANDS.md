# ⚡ Quick Commands - Cloudflare Pages

## 🚀 البدء السريع

```bash
# 1. تثبيت المتعلقات
npm install

# 2. اختبر Build محلياً
npm run build:cf

# 3. اختبر التطبيق
npm run dev:cf

# 4. اختبر Backend فقط
npm start
```

---

## 📤 النشر على GitHub

```bash
# 1. أضف الملفات
git add .

# 2. Commit
git commit -m "feat: Add Cloudflare Pages configuration"

# 3. Push إلى main
git push origin main

# Cloudflare Pages سيبدأ البناء تلقائياً!
```

---

## ⚙️ إعدادات Cloudflare Pages Dashboard

```
Build command:          npm run build:cf
Build output directory: backend
Root directory:         .

Environment Variables:
  MONGODB_URI = ...
  JWT_SECRET = ...
  CLOUDINARY_CLOUD_NAME = ...
  CLOUDINARY_API_KEY = ...
  CLOUDINARY_API_SECRET = ...
  NODE_ENV = production
```

---

## 🔐 إضافة Secrets

```bash
# أضف متغيرات البيئة في Dashboard:
# 1. Pages → Project → Settings
# 2. Environment Variables
# 3. أضف variables من .env.example
```

---

## 📊 Monitoring

```bash
# عرض Logs (يحتاج Wrangler)
wrangler tail

# فتح Dashboard
wrangler pages deployment list
```

---

## 🔄 Redeployment

```bash
# أعد بناء آخر deployment
wrangler pages deployments create
```

---

## ✅ التحقق من الحالة

```bash
# Logs في Cloudflare Dashboard:
# Pages → Project → Deployments → View build log
```

---

## 📝 ملفات مهمة

- `wrangler.toml` ← إعدادات Cloudflare
- `package.json` ← build scripts
- `CLOUDFLARE_PAGES_GUIDE.md` ← دليل شامل
- `.env.example` ← قالب متغيرات البيئة
