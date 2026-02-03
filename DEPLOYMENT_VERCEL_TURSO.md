# دليل نشر المشروع على Vercel (واجهة) و Turso (قاعدة SQLite سحابية)

هذا التقرير يشرح خطوة بخطوة كيفية تجهيز ونشر مشروع `quran-roots-app` بحيث تكون الواجهة مستضافة على Vercel وقاعدة البيانات على Turso (SQLite سحابي). الملف مبسط عملياً ويغطي التغييرات البرمجية، متغيرات البيئة، وعمليات الاستيراد والاختبار.

---

**مقدمة سريعة**
- المشروع موجود كمونوربو. مجلدات مهمة:
  - `client/` : واجهة React + Vite
  - `backend/` : API Express يعتمد حالياً على ملف SQLite محلي (`backend/database/quran_roots_dual_v2.sqlite`)

**المتطلبات قبل البدء**
- حساب Vercel
- حساب Turso (سجل دخولك إلى Turso Console)
- تثبيت أدوات محلية: `pnpm` أو `npm`, ويفضل `vercel` CLI (اختياري)
- الوصول إلى ملف قاعدة البيانات المحلي: `backend/database/quran_roots_dual_v2.sqlite`

---

**خطة العمل (ملف التغييرات الأساسية)**
1. تعديل `backend` ليدعم الاتصال بقاعدة Turso عبر متغيرات بيئة بدلاً من الاعتماد على ملف ثابت.
2. إضافة تبعية عميل Turso/LibSQL في `backend` (مثلاً `@libsql/client` أو حسب توجيهات Turso).
3. تصدير بيانات SQLite الحالية ثم استيرادها إلى قاعدة Turso.
4. إعداد متغيرات البيئة على Vercel (URL و TOKEN لقاعدة Turso، و`BACKEND_URL` إن استُضيف الـ API منفصلاً).
5. نشر الواجهة على Vercel (مشروع يشير إلى `client/`).
6. (اختياري) نشر الـ backend كـ Serverless functions على Vercel أو استضافته على خدمة مناسبة إذا لم ترغب بالتحويل.

---

**تفاصيل التغييرات التقنية (قبل النشر)**

1) جعل الاتصال بقاعدة البيانات قابلاً للتهيئة عبر متغيرات البيئة

  - الملف الحالي: `backend/src/config/database.js` يفتح ملف SQLite محلي ثابت:
    - مسار الملف: `backend/database/quran_roots_dual_v2.sqlite`
  - المطلوب: تعديل الاتصال ليعمل بطريقتين:
    - إذا وُجد متغير بيئة مثل `TURSO_DB_URL` (أو اسم مشابه) يتم الاتصال عبر عميل Turso/LibSQL.
    - خلاف ذلك يبقى الاتصال المحلي عبر `sqlite3` لتسهيل التطوير المحلي.

  - مثال تخطيطي (نموذجي — راجع وثائق `@libsql/client` لتفاصيل API):

```js
// backend/src/config/database.js  (اقتراح)
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let tursoClient = null;
if (process.env.TURSO_DB_URL) {
  // مثال: تثبيت وإستدعاء عميل libsql
  // const { createClient } = require('@libsql/client');
  // tursoClient = createClient({ url: process.env.TURSO_DB_URL, auth: { token: process.env.TURSO_DB_TOKEN } });
}

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, '../../database/quran_roots_dual_v2.sqlite');
    this.db = null;
  }

  async connect() {
    if (tursoClient) {
      // اتصال عبر Turso
      // بعض عملاء libsql لا يحتاجون "connect" تقليدياً؛ يتم استدعاء الاستعلامات مباشرة.
      console.log('✅ Using Turso (remote SQLite)');
      return;
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) reject(err); else resolve(this.db);
      });
    });
  }

  async query(sql, params = []) {
    if (tursoClient) {
      // return await tursoClient.execute(sql, params);
    }
    // existing local implementation...
  }
}

module.exports = { /* export wrapper */ };
```

ملاحظة: قم بمراجعة الوثائق الرسمية لـ Turso/LibSQL لتركيب واجهة العميل الصحيحة (`createClient`, `execute`, إلخ).

2) تثبيت تبعية العميل

- داخل `backend/` شغل:

```bash
cd backend
pnpm add @libsql/client    # أو npm/yarn حسب مديري الحزم لديك
```

3) إعداد متغيرات البيئة المطلوبة

- المتغيرات المقترحة:
  - `TURSO_DB_URL` : عنوان الاتصال بقاعدة Turso (URL أو connection string)
  - `TURSO_DB_TOKEN` : مفاتيح/توكن الوصول (إن تطلب)
  - `BACKEND_URL` : (لواجهة) رابط الـ API عندما يكون منتشرًا منفصلاً

ضع نسخة محلية من هذه المتغيرات في ملف `.env` داخل `backend/` أثناء الاختبار المحلي.

4) تصدير واستيراد بيانات الـ SQLite إلى Turso

- لتصدير من الملف المحلي:

```bash
cd backend/database
sqlite3 quran_roots_dual_v2.sqlite ".dump" > dump.sql
```

- استيراد إلى Turso:
  - الخيار الأسهل: افتح لوحة تحكم Turso (Turso Console) وابحث عن خيار استيراد أو تنفيذ SQL، ثم ارفع `dump.sql` أو نفذ محتواه.
  - إذا لم يكن هناك استيراد مباشر، يمكنك تشغيل السكрипت عبر عميل `@libsql/client` يقوم بقراءة `dump.sql` وتنفيذ الأوامر على قاعدة Turso.

مثال سريع (Node) لقراءة ملف `dump.sql` وتنفيذه عبر client:

```js
const fs = require('fs');
const sql = fs.readFileSync('./dump.sql', 'utf8');
// قسّم SQL إلى استعلامات منفردة ثم نفّذها عبر tursoClient.execute(query)
```

---

**نشر الواجهة على Vercel (الخطوات التفصيلية)**

1. ربط المشروع بمستودع Git (GitHub/GitLab/Bitbucket)
2. في Vercel: أنشئ مشروعاً جديداً واختر المستودع.
3. ضمن إعدادات المشروع في Vercel:
   - Root Directory: `client` (لأن الواجهة في مجلد `client/`)
   - Build Command: `pnpm build` أو `npm run build` (تأكد من وجود `pnpm` في بيئة البناء أو استخدم `npm`)
   - Output Directory: عادة `dist` (Vite يخرج إلى `dist` بشكل افتراضي)
4. أضف متغيرات البيئة في Vercel > Settings > Environment Variables:
   - إذا واجهة تحتاج الوصول إلى الـ API: `VITE_API_BASE` أو `REACT_APP_API_URL` (حسب طريقة القراءة في الواجهة) -> ضع رابط الـ backend المنتشر أو مسار Vercel Functions.
   - لا تقم بوضع مفاتيح Turso في جهة العميل (الواجهة). المفاتيح يجب أن تبقى على الخادم.
5. اضغط Deploy وسيقوم Vercel ببناء ونشر الواجهة.

---

**نشر الـ Backend وخياراته**

الخيار A — تحويل الـ backend إلى Vercel Serverless Functions (مفضل إذا تريد كل شيء على Vercel):
- نقل أو إعادة كتابة نقاط النهاية من `backend/server.js` إلى ملفات في مجلد `api/` في جذر المشروع (أو داخل `client/api` حسب إعداد Vercel). كل ملف يكون بمثابة دالة serverless.
- ميزات: سهولة إعداد متغيرات البيئة ضمن نفس مشروع Vercel، لا حاجة لاستضافة خارجية.
- عيوب: تحتاج إلى تكييف أسلوب التعامل مع الـ SQLite (اتصال طويل المدى غير مناسب في serverless). استخدم عميل Turso/LibSQL الذي يعمل بشكل جيد مع وظائف serverless.

الخيار B — إبقاء الـ backend كخادم Node منفصل واستضافته في خدمة تدعم عمليات Node الدائمة (مثل Railway, Render أو VPS):
- قم بنشر `backend` هناك وأضف متغيرات البيئة الخاصة بـ Turso في إعدادات هذه الخدمة.
- واجهة Vercel تتصل بالـ backend عبر `BACKEND_URL`.

ملاحظة مهمة: Vercel لا تدعم تشغيل سيرفر Node دائم (long-running) كما في `node server.js`. لذلك إن اخترت Vercel للـ backend يجب تحويله إلى وظائف أو استخدام خدمة أخرى.

---

**إعداد متغيرات البيئة على Vercel (عملية واضحة)**
1. افتح صفحة المشروع على Vercel -> Settings -> Environment Variables.
2. أضف:
   - `TURSO_DB_URL` = (قيمة اتصال Turso)
   - `TURSO_DB_TOKEN` = (توكن الوصول، إن وجد)
   - `BACKEND_URL` = https://your-backend-url.example (إن كان الـ backend منفصلاً)
3. اختر البيئة (Production, Preview, Development) لكل متغير حسب الحاجة.

---

**اختبار بعد النشر**
1. اختبر الواجهة المنشورة عبر URL الذي يعطيه Vercel.
2. استخدم `curl` أو Postman لاختبار نقاط الـ API والتأكد من أنها تتصل بقاعدة Turso وتعيد نتائج صحيحة:

```bash
curl -v "https://your-backend.example/api/search?q=..."
```

3. تحقق من سجلات Vercel (Logs) وواجهة Turso Console لأي أخطاء في الاتصال أو SQL.

---

**مشاكل شائعة وحلول سريعة**
- خطأ مصادقة مع Turso: تحقق من أنك وضعت التوكن الصحيح في متغير البيئة `TURSO_DB_TOKEN`، وتأكد أن عنوان الـ URL صحيح.
- استعلامات بطيئة أو أخطاء بسبب تحويل المشروع إلى Serverless: تأكد من أن عميل Turso يدعم الاستخدام في بيئة Serverless وأنك لا تحتفظ باتصالات طويلة عبر إعادة استدعاء الدوال.
- ملف SQLite كبير: قم بتصدير كـ SQL ثم استورد فقط الجداول والبيانات الضرورية، أو ضع بيانات مرجعية فقط في Turso إن لزم.

---

**أوامر مختصرة ومفيدة**
- بناء الواجهة محلياً:
```bash
cd client
pnpm install
pnpm build
```
- تشغيل الـ backend محلياً (قبل التعديل على Turso):
```bash
cd backend
pnpm install
pnpm run dev
```
- تصدير قاعدة SQLite إلى ملف SQL:
```bash
cd backend/database
sqlite3 quran_roots_dual_v2.sqlite ".dump" > dump.sql
```

---

**خلاصة وتوصيات**
- أنسب مسار سريع: احتفظ بـ `backend` كما هو لتطوير محلي، وأنشئ قاعدة Turso واستورد البيانات، ثم حرِّك نقاط النهاية إلى وظائف Serverless باستخدام عميل Turso بحيث تظل المفاتيح على الجانب الخادم، ونشر الواجهة على Vercel من `client/` مع ضبط `BACKEND_URL`.
- إن رغبت، أستطيع: (1) تعديل `backend/src/config/database.js` فعليًا ليشمل دعم Turso كبديل، (2) كتابة مثال وظائف Vercel `api/` لنقطة نهاية واحدة (مثال بحث)، و(3) تقديم ملف `vercel.json` مقترح وشرح كيفية إضافة المتغيرات في واجهة Vercel.

---

ملف التقرير هذا تم إنشاؤه تلقائياً لك كخطوة أولى. أخبرني إذا تريدني أطبق التغييرات البرمجية (تعديل `database.js`, إضافة تبعيات، أو إنشاء مثال `api/` function) وسأقوم بتطبيقها هنا في المستودع.
