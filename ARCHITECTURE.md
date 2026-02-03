# معمارية التطبيق
# Application Architecture

## نظرة عامة / Overview

تطبيق بحث جذور القرآن الكريم هو تطبيق ويب حديث يتبع نمط معمارية **Client-Server** مع فصل واضح بين الواجهة الأمامية والخلفية.

The Quran Roots Search application is a modern web application following a **Client-Server** architecture with clear separation between frontend and backend.

## المكونات الرئيسية / Main Components

### 1. Frontend (React + TypeScript + Tailwind CSS)

**التقنيات المستخدمة / Technologies:**
- React 19 - UI library
- TypeScript - Type safety
- Tailwind CSS 4 - Styling
- Recharts - Data visualization
- Wouter - Routing
- shadcn/ui - Component library

**المسؤوليات / Responsibilities:**
- عرض واجهة المستخدم / User interface rendering
- إدارة حالة التطبيق / Application state management
- التفاعل مع المستخدم / User interactions
- عرض النتائج والإحصائيات / Results and statistics display

### 2. Backend (Express.js + SQLite)

**التقنيات المستخدمة / Technologies:**
- Express.js - Web framework
- SQLite3 - Database driver
- CORS - Cross-origin requests
- Helmet - Security headers
- Morgan - Request logging
- Compression - Response compression

**المسؤوليات / Responsibilities:**
- معالجة طلبات البحث / Handle search requests
- الاتصال بقاعدة البيانات / Database connection
- معالجة البيانات وتحويلها / Data processing and transformation
- حساب الإحصائيات / Statistics calculation

### 3. Database (SQLite)

**الجداول / Tables:**
- `ayah` - الآيات القرآنية / Quranic verses
- `token` - الكلمات والجذور / Words and roots
- `token_uthmani` - الكلمات بالرسم العثماني / Uthmani script words

## تدفق البيانات / Data Flow

### Search Flow

```
User Input (SearchBar)
    ↓
QuranContext.searchByRoot()
    ↓
API Call: GET /api/search/root/:root
    ↓
Backend: rootService.searchByRoot()
    ↓
Database Queries:
  1. Get ayahs containing root
  2. Get tokens for each ayah
  3. Get accompanying roots
    ↓
Response: {root, ayahs[], totalOccurrences}
    ↓
Update QuranContext State
    ↓
Re-render Results & Statistics Components
```

## API Endpoints

### Search Endpoints

**GET /api/search/root/:root**
- Search for a specific root
- Returns: `{root, ayahs[], totalOccurrences}`

**GET /api/search/statistics/:root**
- Get root statistics
- Returns: `{root, statistics}`

### Ayah Endpoints

**GET /api/ayah/:ayahId**
- Get ayah details
- Returns: `{id, surahNo, ayahNo, surahName, text, tokens[], page, juz}`

### Surah Endpoints

**GET /api/surahs**
- Get all surahs
- Returns: `[{number, name}, ...]`

**GET /api/surahs/:surahNo**
- Get specific surah
- Returns: `{number, name}`

## State Management

### Global State (QuranContext)

The application uses React Context API for global state management:

```typescript
interface QuranContextType {
  searchResults: SearchResult | null;
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  recentSearches: string[];
  searchByRoot: (root: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}
```

**Persistent State:**
- `recentSearches` - Stored in localStorage for search history

## Performance Considerations

### Database Optimization
1. Ensure indexes on `token.root` and `ayah.global_ayah`
2. Use efficient SQL queries with GROUP BY and DISTINCT
3. Consider connection pooling for production

### Frontend Optimization
1. Code splitting for large components
2. Memoization of expensive computations
3. Efficient chart rendering with Recharts

### Caching Strategy
1. Browser cache for static assets
2. API response caching for frequent searches
3. Database query caching

## Security Measures

### Backend Security
- Helmet.js for secure HTTP headers
- CORS configured for frontend origin
- Input validation before database queries
- Parameterized queries to prevent SQL injection

### Frontend Security
- React's built-in XSS protection
- Content Security Policy via Helmet
- Secure cookie handling

## Error Handling

### Backend
- Try-catch blocks for all async operations
- Proper HTTP status codes
- Detailed error messages in development mode

### Frontend
- Error boundary component for React errors
- User-friendly error messages
- Error state in QuranContext

## Design Philosophy

### Islamic Minimalism with Semantic Depth

The application follows a design philosophy that combines:

- **Colors**: Deep Islamic Blue, Gold accents, Warm cream background
- **Typography**: Amiri for headings, Cairo for body text
- **Layout**: Content-first, asymmetric grid, generous whitespace
- **Interactions**: Smooth transitions, meaningful animations

## File Structure

```
quran-roots-app/
├── client/                          # Frontend (React)
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   ├── contexts/                # Global state
│   │   ├── pages/                   # Page components
│   │   ├── App.tsx                  # Main app
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   └── package.json
├── backend/                         # Backend (Express)
│   ├── src/
│   │   ├── config/                  # Database config
│   │   ├── services/                # Business logic
│   │   └── routes/                  # API endpoints
│   ├── database/                    # SQLite database
│   ├── server.js                    # Express app
│   └── package.json
├── README.md                        # Project overview
├── SETUP.md                         # Installation guide
└── ARCHITECTURE.md                  # This file
```

## Deployment

### Frontend
- Build with `pnpm build`
- Deploy to Vercel, Netlify, or similar
- Environment: Production with minification

### Backend
- Run with `npm start`
- Deploy to Heroku, Railway, or similar
- Include SQLite database file

### Environment Variables

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3001/api
```

**Backend (.env):**
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=./database/quran_roots_dual_v2.sqlite
```

## Future Enhancements

- Advanced search filters (Surah, Juz, Page)
- Export results to PDF
- Comparison between multiple roots
- Tafsir integration
- User accounts and saved searches
- Dark mode support
- Multi-language support
- Mobile app version

---

**Version:** 1.0.0
**Last Updated:** February 2, 2026
