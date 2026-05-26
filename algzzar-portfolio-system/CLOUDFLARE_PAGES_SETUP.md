# ✅ الإعدادات الصحيحة لـ Cloudflare Pages

## 📋 Cloudflare Pages Build Settings

### Build Command
```
npm run build:cf
```

### Root Directory
```
.
```
*(أو اتركها فارغة - تعني الجذر الرئيسي)*

### Build Output Directory
```
backend
```
*(أو `.` إذا كنت تنشر كل شيء)*

### Deploy Command
```
❌ احذفها - ليست مطلوبة (Pages تتعامل معها تلقائياً)
```

---

## 🔑 Environment Variables المطلوبة

**في Cloudflare Pages Dashboard → Settings → Environment Variables**

### Production Environment:
```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/algzzar_portfolio
JWT_SECRET = your_super_secret_key_at_least_32_characters_long
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
NODE_ENV = production
BACKEND_URL = https://api.yourdomain.com
PORTFOLIO_URL = https://yourdomain.com
```

### Preview Environment (Development):
```
MONGODB_URI = mongodb+srv://username:password@cluster-dev.mongodb.net/algzzar_portfolio_dev
JWT_SECRET = dev_secret_key
CLOUDINARY_CLOUD_NAME = your_cloud_name
CLOUDINARY_API_KEY = your_api_key
CLOUDINARY_API_SECRET = your_api_secret
NODE_ENV = development
```

---

## 🔗 GitHub Integration

### 1. إنشاء GitHub Token:
1. اذهب إلى [GitHub Settings → Developer settings](https://github.com/settings/tokens)
2. انقر **"Generate new token"** → **"Generate new token (classic)"**
3. أعطه اسم: `cloudflare-pages`
4. اختر Scopes:
   - ✅ `repo` (full control)
   - ✅ `workflow` (update GitHub Actions workflows)
5. انقر **"Generate token"**
6. **انسخ الـ token فوراً** (لن تستطيع رؤيته مرة أخرى)

### 2. في Cloudflare Pages:
- Pages → **Create a project**
- اختر **"Connect to Git"**
- الصق الـ GitHub token
- اختر `algzzar-portfolio-system` repo
- اختر branch `main`

### 3. في Build Settings:
- **Build command:** `npm run build:cf`
- **Build output directory:** `backend` أو `.`

---

## 🚀 صيغة Build Command المدعومة:

### ✅ الخيار الأول (الموصى به):
```bash
npm run build:cf
```
*(يعمل مع script في package.json)*

### ✅ الخيار الثاني (مفصل):
```bash
npm install && cd backend && npm install && npm run start
```

### ✅ الخيار الثالث (Node.js محض):
```bash
npm install
```
*(للمتطلبات البسيطة جداً)*

### ❌ تجنب:
```bash
npm run build          ❌ (لا يوجد script هكذا)
cd backend && npm run build  ❌ (مسار خاطئ)
npx wrangler deploy   ❌ (للـ Workers فقط، ليس Pages)
```

---

## 📊 مثال على Cloudflare Pages Form:

```
Project Name:           algzzar-portfolio-system
Production Branch:      main
Build Command:          npm run build:cf
Build Output Directory: backend
Root Directory:         . (فارغ)

Environment Variables:
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=your_secret_key
  CLOUDINARY_CLOUD_NAME=your_name
  CLOUDINARY_API_KEY=your_key
  CLOUDINARY_API_SECRET=your_secret
  NODE_ENV=production
```

---

## ⚠️ Common Issues & Solutions:

### ❌ "Build failed"
**السبب:** Build command خاطئ
**الحل:** استخدم `npm run build:cf` أو `npm install`

### ❌ "Cannot find module"
**السبب:** لم تثبت المتعلقات
**الحل:** تأكد أن `npm install` يعمل قبل أي command

### ❌ "Environment variables not found"
**السبب:** المتغيرات لم تضاف في Dashboard
**الحل:** أضفها في Pages → Settings → Environment Variables

### ❌ "MONGODB_URI connection refused"
**السبب:** قاعدة البيانات غير متاحة
**الحل:** استخدم MongoDB Atlas بـ IP Whitelist ل Cloudflare IPs

---

## ✅ Checklist قبل النشر:

- [ ] تثبيت repo على GitHub
- [ ] إنشاء GitHub token
- [ ] ربط Repo بـ Cloudflare Pages
- [ ] إضافة Build Command: `npm run build:cf`
- [ ] تعيين Root Directory: `.`
- [ ] إضافة جميع Environment Variables
- [ ] التحقق من MONGODB_URI والـ Cloudinary keys
- [ ] تشغيل Build test محلياً: `npm run build:cf`
- [ ] الضغط على Deploy

---

## 🧪 اختبار محلي قبل النشر:

```bash
# 1. ثبت المتعلقات
npm install

# 2. اختبر Build command
npm run build:cf

# 3. اختبر المشروع محلياً
npm run dev:cf

# 4. فتح في المتصفح
http://localhost:8787
```

---

## 📞 الدعم:

إذا استمرت المشاكل:
1. تحقق من Logs في Cloudflare Dashboard
2. تأكد من Environment Variables
3. اختبر Build محلياً أولاً
4. تحقق من GitHub Actions logs (اختياري)
