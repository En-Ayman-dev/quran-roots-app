# تطبيق بحث جذور القرآن الكريم
# Quran Roots Search Application

تطبيق ويب حديث للبحث عن جذور الكلمات في القرآن الكريم مع عرض الآيات المرتبطة والإحصائيات الشاملة.

A modern web application for searching Quranic roots with comprehensive statistics and related verses.

## المميزات / Features

- **البحث السريع عن الجذور** - Fast root search with real-time results
- **عرض الآيات المرتبطة** - Display all related verses with proper formatting
- **إحصائيات شاملة** - Comprehensive statistics including:
  - إجمالي التكرارات / Total occurrences
  - توزيع السور / Surah distribution
  - الجذور المصاحبة / Accompanying roots
  - توزيع الأجزاء والصفحات / Juz and page distribution
- **واجهة عربية احترافية** - Professional Arabic UI with RTL support
- **رسوم بيانية تفاعلية** - Interactive charts and visualizations
- **تاريخ البحث** - Recent searches history

## البنية الهندسية / Architecture

### Frontend (React + TypeScript)
```
client/
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx      # Search input component
│   │   ├── Results.tsx         # Results display component
│   │   └── Statistics.tsx      # Statistics and charts
│   ├── contexts/
│   │   └── QuranContext.tsx    # Global state management
│   ├── pages/
│   │   └── Home.tsx            # Main page
│   ├── App.tsx                 # Main app component
│   └── index.css               # Global styles with Islamic Minimalism theme
├── public/
│   └── index.html
└── package.json
```

### Backend (Express + SQLite)
```
backend/
├── src/
│   ├── config/
│   │   └── database.js         # Database configuration
│   ├── services/
│   │   └── rootService.js      # Root search logic
│   └── routes/
│       ├── searchRoutes.js     # Search endpoints
│       ├── ayahRoutes.js       # Ayah details endpoints
│       └── surahRoutes.js      # Surah list endpoints
├── server.js                   # Express server entry point
└── package.json
```

### Database
- **Type**: SQLite3
- **File**: `database/quran_roots_dual_v2.sqlite`
- **Tables**:
  - `ayah` - Quranic verses with Uthmani text
  - `token` - Words mapped to their roots
  - `token_uthmani` - Uthmani script variant

## المتطلبات / Requirements

- **Node.js** >= 16.0.0
- **npm** or **pnpm** >= 7.0.0
- **SQLite3** database file

## التثبيت والتشغيل / Installation & Setup

### 1. تثبيت المكتبات / Install Dependencies

```bash
# Install frontend dependencies
cd client
pnpm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. إعداد قاعدة البيانات / Setup Database

ضع ملف قاعدة البيانات في المسار التالي:
Place the database file at:
```
backend/database/quran_roots_dual_v2.sqlite
```

### 3. تشغيل التطبيق / Run Application

#### Development Mode

**Terminal 1 - Frontend:**
```bash
cd client
pnpm dev
# Frontend will run on http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Backend will run on http://localhost:3001
# API will be available at http://localhost:3001/api
```

#### Production Mode

**Build Frontend:**
```bash
cd client
pnpm build
```

**Run Backend:**
```bash
cd backend
npm start
```

## API Endpoints / نقاط النهاية

### Search Endpoints

**Search by Root**
```
GET /api/search/root/:root
```
Returns all verses containing the specified root with detailed token information.

**Example:**
```bash
curl http://localhost:3001/api/search/root/رحم
```

**Response:**
```json
{
  "root": "رحم",
  "ayahs": [
    {
      "id": "1:1",
      "surahNo": 1,
      "ayahNo": 1,
      "surahName": "الفاتحة",
      "text": "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      "rootCount": 2,
      "tokens": [...],
      "otherRoots": [...],
      "page": 1,
      "juz": 1
    }
  ],
  "totalOccurrences": 57
}
```

**Get Statistics**
```
GET /api/search/statistics/:root
```
Returns comprehensive statistics for a root.

### Ayah Endpoints

**Get Ayah Details**
```
GET /api/ayah/:ayahId
```

### Surah Endpoints

**Get All Surahs**
```
GET /api/surahs
```

**Get Specific Surah**
```
GET /api/surahs/:surahNo
```

## التصميم / Design Philosophy

### Islamic Minimalism with Semantic Depth

التطبيق يتبع فلسفة تصميم تجمع بين الحداثة والتقاليد الإسلامية:

The application follows a design philosophy that combines modernity with Islamic traditions:

- **الألوان / Colors**:
  - Primary: Deep Islamic Blue (#1e3a8a)
  - Accent: Gold (#d97706)
  - Background: Warm Cream (#faf8f3)

- **الخطوط / Typography**:
  - Arabic Headings: Amiri (traditional, scholarly)
  - Arabic Body: Cairo (modern, legible)
  - English: Crimson Text & Lato

- **التخطيط / Layout**:
  - Content-first design
  - Asymmetric grid (70% results, 30% statistics)
  - Generous whitespace and vertical rhythm

## الملفات الهامة / Important Files

| File | Purpose |
|------|---------|
| `client/src/contexts/QuranContext.tsx` | Global state management |
| `client/src/components/SearchBar.tsx` | Search interface |
| `client/src/components/Results.tsx` | Results display |
| `client/src/components/Statistics.tsx` | Statistics & charts |
| `backend/src/services/rootService.js` | Core search logic |
| `backend/src/config/database.js` | Database connection |
| `client/src/index.css` | Design tokens & theme |

## التطوير المستقبلي / Future Enhancements

- [ ] Advanced search filters (Surah, Juz, Page)
- [ ] Export results to PDF
- [ ] Comparison between multiple roots
- [ ] Tafsir integration
- [ ] User accounts and saved searches
- [ ] Mobile app version
- [ ] Dark mode support
- [ ] Multi-language support

## الترخيص / License

MIT License

## المساهمة / Contributing

Contributions are welcome! Please feel free to submit pull requests.

---

**تم التطوير بواسطة / Developed with ❤️**

For questions or issues, please open an issue on the repository.
