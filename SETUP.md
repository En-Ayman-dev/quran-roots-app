# دليل الإعداد والتثبيت
# Setup and Installation Guide

## المتطلبات الأساسية / Prerequisites

- **Node.js** version 16 or higher
- **npm** or **pnpm** package manager
- **SQLite3** database file: `quran_roots_dual_v2.sqlite`

## خطوات التثبيت / Installation Steps

### Step 1: استخراج الملفات / Extract Files

```bash
# Extract the project files
unzip quran-roots-app.zip
cd quran-roots-app
```

### Step 2: تثبيت المكتبات / Install Dependencies

#### Frontend
```bash
cd client
pnpm install
# or
npm install
```

#### Backend
```bash
cd ../backend
npm install
```

### Step 3: إعداد قاعدة البيانات / Setup Database

ضع ملف قاعدة البيانات في المجلد التالي:

Place your SQLite database file at:
```
backend/database/quran_roots_dual_v2.sqlite
```

**ملاحظة مهمة / Important Note:**
- Database file must be named exactly: `quran_roots_dual_v2.sqlite`
- It should contain tables: `ayah`, `token`, `token_uthmani`
- Database must have proper indexes for performance

### Step 4: تشغيل التطبيق / Run Application

#### Option A: Development Mode (Recommended for Testing)

**Terminal 1 - Start Frontend:**
```bash
cd client
pnpm dev
```
Frontend will be available at: `http://localhost:5173`

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend API will be available at: `http://localhost:3001/api`

#### Option B: Production Mode

**Build Frontend:**
```bash
cd client
pnpm build
```

**Start Backend (serves frontend):**
```bash
cd backend
npm start
```
Application will be available at: `http://localhost:3001`

## التحقق من التثبيت / Verification

### Check Frontend
Open browser and visit: `http://localhost:5173`
- You should see the Quran Roots Search interface
- Search bar should be visible at the top

### Check Backend
```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### Test Search API
```bash
# Search for root "رحم"
curl "http://localhost:3001/api/search/root/رحم"

# Should return JSON with search results
```

## استكشاف الأخطاء / Troubleshooting

### Database Not Found
**Error:** `Cannot find database file`

**Solution:**
- Verify database file is in `backend/database/` directory
- Check filename is exactly: `quran_roots_dual_v2.sqlite`
- Ensure file has read permissions

### Port Already in Use
**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Change backend port in environment
# Create backend/.env file with:
PORT=3002

# Or kill process using the port:
# On Linux/Mac:
lsof -i :3001
kill -9 <PID>

# On Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend
**Error:** Network error when searching

**Solution:**
1. Ensure backend is running on port 3001
2. Check CORS is enabled (it is by default)
3. Verify API URL in frontend context:
   - File: `client/src/contexts/QuranContext.tsx`
   - API base should be: `http://localhost:3001/api`

### Dependencies Installation Fails
**Error:** npm/pnpm install fails

**Solution:**
```bash
# Clear cache
npm cache clean --force
# or
pnpm store prune

# Try installing again
npm install
# or
pnpm install

# If still failing, try:
npm install --legacy-peer-deps
```

## الملفات المهمة / Important Files

### Frontend Configuration
- `client/src/contexts/QuranContext.tsx` - API configuration
- `client/.env` - Frontend environment variables
- `client/src/index.css` - Theme and styling

### Backend Configuration
- `backend/server.js` - Express server setup
- `backend/src/config/database.js` - Database connection
- `backend/.env` - Backend environment variables

## متغيرات البيئة / Environment Variables

### Frontend (`client/.env`)
```
VITE_API_URL=http://localhost:3001/api
```

### Backend (`backend/.env`)
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_PATH=./database/quran_roots_dual_v2.sqlite
```

## الأداء والتحسينات / Performance Tips

1. **Database Indexing:**
   - Ensure indexes exist on `token.root` and `ayah.global_ayah`
   - This significantly improves search performance

2. **Caching:**
   - Consider implementing Redis for frequently searched roots
   - Cache statistics results for 1 hour

3. **Pagination:**
   - Implement pagination for large result sets
   - Current implementation loads all results at once

4. **Frontend Optimization:**
   - Results are already lazy-loaded with React
   - Charts use Recharts for efficient rendering

## الدعم والمساعدة / Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review server logs in terminal
3. Check browser console for errors (F12)
4. Verify database file integrity

## الخطوات التالية / Next Steps

1. **Customize Styling:**
   - Edit `client/src/index.css` for theme colors
   - Modify `client/src/pages/Home.tsx` for layout changes

2. **Add Features:**
   - Advanced search filters
   - Export to PDF
   - Comparison between roots
   - User accounts

3. **Deploy:**
   - Frontend: Deploy to Vercel, Netlify, or similar
   - Backend: Deploy to Heroku, Railway, or similar
   - Database: Use hosted SQLite or migrate to PostgreSQL

---

**Happy searching! / البحث الممتع!**
