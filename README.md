# 🚀 Algzzar Portfolio System

نظام محفظة رقمية فاخر مع لوحة تحكم متقدمة.

## 📁 بنية المشروع

```
algzzar-portfolio-system/
├── package.json                    ← Root configuration
├── wrangler.toml                   ← Cloudflare config
├── CLOUDFLARE_PAGES_GUIDE.md       ← دليل النشر
├── CLOUDFLARE_FIX.md               ← التصحيحات الأخيرة
│
└── algzzar-portfolio-system/       ← المشروع الفعلي
    ├── backend/                    ← Node.js API
    │   ├── package.json
    │   ├── server.js
    │   ├── app.js
    │   ├── routes/
    │   ├── controllers/
    │   ├── models/
    │   ├── config/
    │   └── ...
    │
    ├── frontend/                   ← HTML/CSS/JS
    │   ├── index.html
    │   ├── admin-login.html
    │   ├── dashboard.html
    │   └── js/
    │
    └── dashboard/                  ← Dashboard
        ├── ahmed-algzzar-dashboard.html
        └── ahmed_algzzar_portfolio.html
```

---

## 🚀 البدء السريع

### تثبيت المتعلقات:
```bash
npm install
cd algzzar-portfolio-system/backend
npm install
```

### تشغيل محلياً:
```bash
npm start
```

### اختبر البناء:
```bash
npm run build:cf
```

---

## ☁️ النشر على Cloudflare Pages

### الإعدادات:
```
Build command:              npm run build:cf
Build output directory:     algzzar-portfolio-system/backend
Root directory:             .
Framework preset:           None / Other
```

### متغيرات البيئة:
```
MONGODB_URI=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
```

### Deploy:
```bash
git add .
git commit -m "your message"
git push origin main
```

---

## 📚 الملفات المهمة

- [CLOUDFLARE_PAGES_GUIDE.md](CLOUDFLARE_PAGES_GUIDE.md) - دليل شامل
- [CLOUDFLARE_FIX.md](CLOUDFLARE_FIX.md) - التصحيحات الأخيرة
- [QUICK_COMMANDS.md](QUICK_COMMANDS.md) - أوامر سريعة

---

## 🔐 متغيرات البيئة

اسخ `.env.example` أو `.env.cloudflare.example` و املأ القيم:

```bash
cp algzzar-portfolio-system/.env.example .env
```

---

## 📞 المساعدة

راجع الملفات التالية:
1. CLOUDFLARE_PAGES_GUIDE.md - للتفاصيل الكاملة
2. CLOUDFLARE_FIX.md - للمشاكل الشائعة
3. QUICK_COMMANDS.md - للأوامر السريعة

---

## 📝 الترخيص

MIT License - اقرأ LICENSE file للمزيد
