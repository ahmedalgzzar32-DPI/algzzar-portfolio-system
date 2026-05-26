# 🚀 Cloudflare Pages - دليل النشر الكامل

## 📋 نظرة عامة

**Cloudflare Pages** هي منصة لنشر تطبيقات الويب (Static Sites + API Functions) بدون الحاجة لإدارة servers.

---

## ✅ الإعدادات الصحيحة

### **Build Settings في Cloudflare Pages Dashboard:**

```
Framework preset:        None / Other
Build command:          npm run build:cf
Build output directory:  backend
Root directory:         . (أو فارغ)
Environment:            (أنظر أدناه)
```

### **Environment Variables:**

#### **Production:**
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/algzzar_portfolio
JWT_SECRET = your_super_secret_key_min_32_chars
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
NODE_ENV = production
```

#### **Preview (Development):**
```
MONGODB_URI = mongodb+srv://username:password@cluster-dev.mongodb.net/algzzar_portfolio_dev
JWT_SECRET = dev_secret_key
NODE_ENV = development
```

---

## 🔗 خطوات النشر

### **الخطوة 1: ربط GitHub Repository**

1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. اختر **Pages** من القائمة الجانبية
3. انقر **Create a project**
4. اختر **Connect to Git**
5. اختر **GitHub**
6. أعطّل الإجازة (Authorize) لـ Cloudflare access
7. اختر `algzzar-portfolio-system` repository
8. اختر branch: `main`

### **الخطوة 2: إعداد Build Configuration**

في الصفحة **Build configuration:**

```
Build command:          npm run build:cf
Build output directory: backend
Root directory:         .
```

### **الخطوة 3: إضافة Environment Variables**

1. انقر **Settings** → **Environment variables**
2. أضف المتغيرات التالية:

**Production (main branch):**
- `MONGODB_URI`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NODE_ENV` = `production`

**Preview (all branches except main):**
- نفس المتغيرات أعلاه لكن بـ dev values

### **الخطوة 4: Deploy**

انقر **Save and Deploy**

الـ Pages سيقوم بـ:
1. ✅ Clone الـ repo من GitHub
2. ✅ تشغيل `npm run build:cf`
3. ✅ نشر الـ output من مجلد `backend`

---

## 📊 مثال على Cloudflare Pages Dashboard

```
Project Name:      algzzar-portfolio-system
Production branch: main
Build command:     npm run build:cf
Output directory:  backend
Root directory:    .

Environment Variables:
┌─────────────────────────────┬──────────────────────┐
│ Name                        │ Value (Production)   │
├─────────────────────────────┼──────────────────────┤
│ MONGODB_URI                 │ mongodb+srv://...    │
│ JWT_SECRET                  │ your_secret_key      │
│ CLOUDINARY_CLOUD_NAME       │ your_cloud_name      │
│ CLOUDINARY_API_KEY          │ your_api_key         │
│ CLOUDINARY_API_SECRET       │ your_api_secret      │
│ NODE_ENV                    │ production           │
└─────────────────────────────┴──────────────────────┘
```

---

## 🔑 كيفية الحصول على معرف الحساب (Account ID)

1. اذهب إلى [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. اختر domain أي (أو اذهب إلى أي صفحة)
3. الـ Account ID يكون في الـ URL أو في **الإعدادات**
4. أو استخدم:
```bash
wrangler whoami
```

---

## 🛠️ Local Development قبل النشر

### اختبر البناء محلياً:

```bash
# 1. ثبت المتعلقات
npm install

# 2. اختبر Build command
npm run build:cf

# 3. انسخ .env.example إلى .env و أملأها
cp .env.example .env
# أضف متغيراتك

# 4. شغّل التطبيق
npm run dev:cf
# أو
npm start

# 5. فتح في المتصفح
http://localhost:8787
```

---

## ⚡ Cloudflare Pages vs Pages + Functions

### **Pages (Static Site):**
- HTML, CSS, JS files فقط
- بدون Node.js runtime
- أسرع وأرخص

### **Pages + Functions:**
- Static site + API Functions
- Node.js runtime متاح
- يدعم Backend logic
- ✅ **هذا ما نحتاجه!**

---

## 🔄 Git Workflow

### عند كل commit إلى `main`:
```
1. Commit → GitHub
2. GitHub webhook → Cloudflare
3. Cloudflare runs: npm run build:cf
4. نشر تلقائي
```

### عند فتح Pull Request:
```
1. PR → GitHub
2. GitHub webhook → Cloudflare
3. Cloudflare بناء Preview
4. رابط Preview في PR comments
```

---

## ✅ Checklist قبل النشر

- [ ] Repository مربوط بـ GitHub
- [ ] branch `main` موجود
- [ ] `package.json` في الجذر الرئيسي
- [ ] `npm run build:cf` يعمل محلياً
- [ ] `.env.example` موجود بجميع المتغيرات
- [ ] Account ID صحيح في wrangler.toml
- [ ] جميع Environment Variables مضافة في Dashboard
- [ ] MongoDB accessible من Cloudflare IPs
- [ ] Cloudinary API keys صحيحة

---

## 🐛 Troubleshooting

### ❌ "Build failed"
```
السبب: Build command خاطئ
الحل: تأكد أن npm run build:cf يعمل محلياً
```

### ❌ "ENOENT: no such file or directory"
```
السبب: package.json مفقود
الحل: تأكد أن package.json في الجذر الرئيسي (/)
```

### ❌ "Cannot find MONGODB_URI"
```
السبب: Environment variable مفقودة
الحل: أضفها في Pages Dashboard → Settings
```

### ❌ "Module not found: express"
```
السبب: npm install لم يعمل
الحل: تأكد أن build command يحتوي على npm install
```

### ❌ "CORS error"
```
السبب: Frontend و Backend من domains مختلفة
الحل: تأكد من CORS configuration في backend
```

---

## 📈 Monitoring و Logs

### عرض Build Logs:
1. Pages → Project → Deployments
2. اختر الـ deployment الأخير
3. انقر **View build log**

### عرض Runtime Logs:
1. Pages → Project → Analytics
2. أو استخدم:
```bash
wrangler tail
```

---

## 🚀 Advanced: Custom Domain

### ربط domain:
1. Pages → Project → Custom domains
2. أضف domain
3. إذا كان domain على Cloudflare:
   - سيتم الـ routing تلقائياً
4. إذا كان domain على nameserver آخر:
   - أضف CNAME record
   - `CNAME: your-project.pages.dev`

---

## 💡 نصائح مهمة

✅ **استخدم Environment Variables** لكل الـ secrets
✅ **اختبر محلياً** قبل الـ push
✅ **راقب Build Logs** عند الأخطاء
✅ **استخدم Preview Deployments** للـ PRs
✅ **حافظ على .env.example** محدث
✅ **استخدم strong JWT_SECRET** (min 32 chars)

---

## 📚 مراجع مفيدة

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Pages Build Configuration](https://developers.cloudflare.com/pages/platform/build-configuration/)
- [Environment Variables](https://developers.cloudflare.com/pages/platform/environment-variables/)
- [Troubleshooting](https://developers.cloudflare.com/pages/platform/known-issues-and-limitations/)

---

## 🎯 الخلاصة

```
┌─────────────────────────────────────────────┐
│   GitHub → Cloudflare Pages (Automatic)    │
├─────────────────────────────────────────────┤
│ 1. git push to main                        │
│ 2. GitHub webhook                          │
│ 3. Cloudflare Pages webhook                │
│ 4. npm run build:cf                        │
│ 5. Deploy automatically                    │
│ 6. Live on yourdomain.com 🎉               │
└─────────────────────────────────────────────┘
```

كل شيء تلقائي الآن! 🚀
