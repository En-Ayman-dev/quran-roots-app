# دليل البدء السريع
# Quick Start Guide

## الخطوات السريعة / Quick Steps

### 1. استخراج الملفات / Extract Files
```bash
unzip quran-roots-app.zip
cd quran-roots-app
```

### 2. تثبيت المكتبات / Install Dependencies

**Frontend:**
```bash
cd client
pnpm install
# أو / or
npm install
```

**Backend:**
```bash
cd ../backend
npm install
```

### 3. إضافة قاعدة البيانات / Add Database

ضع ملف `quran_roots_dual_v2.sqlite` في:
```
backend/database/quran_roots_dual_v2.sqlite
```

### 4. تشغيل التطبيق / Run Application

**Terminal 1 - Frontend:**
```bash
cd client
pnpm dev
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

### 5. الوصول للتطبيق / Access Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/health

## اختبار البحث / Test Search

جرب البحث عن جذر:
Try searching for a root:

```bash
# في المتصفح / In browser:
http://localhost:5173

# أو عبر API / Or via API:
curl "http://localhost:3001/api/search/root/رحم"
```

## الملفات المهمة / Important Files

| الملف / File | الوصف / Description |
|---|---|
| `README.md` | نظرة عامة على المشروع / Project overview |
| `SETUP.md` | تعليمات التثبيت المفصلة / Detailed setup |
| `ARCHITECTURE.md` | معمارية التطبيق / Architecture details |
| `backend/server.js` | خادم Express / Express server |
| `client/src/App.tsx` | تطبيق React الرئيسي / Main React app |

## استكشاف الأخطاء / Troubleshooting

### المنفذ مستخدم / Port in use
```bash
# غير المنفذ في backend/.env
PORT=3002
```

### قاعدة البيانات غير موجودة / Database not found
```bash
# تأكد من وضع الملف في:
backend/database/quran_roots_dual_v2.sqlite
```

### خطأ في الاتصال / Connection error
```bash
# تأكد من تشغيل Backend:
cd backend && npm run dev
```

## المميزات / Features

✅ البحث السريع عن الجذور / Fast root search
✅ عرض الآيات المرتبطة / Related verses display
✅ إحصائيات شاملة / Comprehensive statistics
✅ رسوم بيانية تفاعلية / Interactive charts
✅ واجهة عربية احترافية / Professional Arabic UI
✅ تاريخ البحث / Search history

## الخطوات التالية / Next Steps

1. **تخصيص الألوان / Customize Colors:**
   - عدّل `client/src/index.css`

2. **إضافة مميزات / Add Features:**
   - تصفية متقدمة / Advanced filters
   - تصدير PDF / PDF export
   - مقارنة الجذور / Compare roots

3. **النشر / Deploy:**
   - Frontend: Vercel, Netlify
   - Backend: Heroku, Railway

## المساعدة / Help

- اقرأ `README.md` للمزيد من المعلومات
- اقرأ `SETUP.md` لحل المشاكل
- اقرأ `ARCHITECTURE.md` للتفاصيل التقنية

---

**استمتع بالتطبيق! / Enjoy the app!** 🚀
