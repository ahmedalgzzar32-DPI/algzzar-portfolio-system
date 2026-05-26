# 🚀 نشر المشروع على Cloudflare

## الخطوات المطلوبة:

### 1️⃣ **تثبيت Wrangler CLI**
```bash
npm install -g @cloudflare/wrangler
# أو استخدم wrangler من المشروع نفسه
npm run cf:init
```

### 2️⃣ **تسجيل الدخول إلى Cloudflare**
```bash
npm run cf:login
# أو
wrangler login
```

### 3️⃣ **تحديث wrangler.toml**
استبدل القيم التالية بقيمك الفعلية:
- `account_id`: معرّف حسابك على Cloudflare (من [dashboard](https://dash.cloudflare.com/))
- `your_kv_namespace_id`: معرّف KV Namespace إذا كنت تريد استخدام الـ caching
- `your_d1_database_id`: معرّف D1 Database إذا كنت تريد استخدام قاعدة بيانات Cloudflare

### 4️⃣ **البناء المحلي**
```bash
npm install
npm run build:cf
npm run dev:cf
```

### 5️⃣ **النشر على Cloudflare**
```bash
npm run deploy:cf
```

---

## ⚙️ خيارات النشر:

### **الخيار الأول: Cloudflare Workers (موصى به)**
- API سيروفليس يعمل على Cloudflare Workers
- يدعم Node.js APIs
- دفع حسب الاستخدام

```bash
wrangler publish
```

### **الخيار الثاني: Cloudflare Pages + Functions**
1. ربط مستودع GitHub
2. تعيين build command: `npm run build:cf`
3. تعيين output directory: `/`

### **الخيار الثالث: Cloudflare Pages (Frontend فقط)**
```bash
wrangler pages deploy frontend/
```

---

## 🔑 متغيرات البيئة المطلوبة:

```toml
# في wrangler.toml أو Cloudflare Dashboard
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=production
BACKEND_URL=https://api.yourdomain.com
```

### إضافة متغيرات البيئة:
```bash
# محلياً
wrangler secret put MONGODB_URI
wrangler secret put JWT_SECRET
# إلخ...

# أو من خلال Dashboard:
# 1. Settings > Environment Variables
# 2. أضف المتغيرات
```

---

## 📊 Cloudflare KV (للـ Caching والـ Sessions):

### إنشاء KV Namespace:
```bash
wrangler kv:namespace create "KV_STORE"
wrangler kv:namespace create "KV_STORE" --preview
```

سيعطيك معرفات KV - ضعها في `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "KV_STORE"
id = "YOUR_KV_ID"
preview_id = "YOUR_PREVIEW_ID"
```

---

## 🗄️ Cloudflare D1 Database (اختياري):

إذا أردت استخدام D1 بدلاً من MongoDB:

```bash
# إنشاء D1 Database
wrangler d1 create algzzar_portfolio

# تشغيل migrations
wrangler d1 execute algzzar_portfolio --file ./schema.sql
```

---

## 🔗 Domain/DNS:

1. أضف domain في [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. استخدم CNAME record:
   ```
   api.yourdomain.com → your-worker.your-account.workers.dev
   ```

---

## 📝 ملفات مهمة:

- **`wrangler.toml`** - إعدادات Cloudflare Workers
- **`worker.js`** - Entry point للـ Worker
- **`package.json`** - سكريبتات البناء والنشر

---

## ✅ التحقق من النشر:

```bash
# فتح الموقع
wrangler publish --open

# أو من خلال الرابط:
# https://algzzar-portfolio-system.your-account.workers.dev

# التحقق من الـ health
curl https://algzzar-portfolio-system.your-account.workers.dev/api/health
```

---

## 🛠️ Troubleshooting:

### خطأ: "account_id is missing"
- عدّل `wrangler.toml` وأضف `account_id` الصحيح

### خطأ: "KV binding not found"
- تأكد من إنشاء KV Namespace
- تأكد من معرفات KV في `wrangler.toml`

### Backend لا يعمل
- تحقق من متغيرات البيئة
- تأكد من وصول MongoDB من Cloudflare
- استخدم Cloudflare D1 بدلاً من MongoDB إذا لزم الأمر

---

## 📚 مراجع مفيدة:

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [D1 Database](https://developers.cloudflare.com/d1/)
