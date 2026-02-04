// const sqlite3 = require('sqlite3').verbose();
// const path = require('path');

// class Database {
//   constructor() {
//     this.dbPath = path.join(__dirname, '../../database/quran_roots_dual_v2.sqlite');
//     this.db = null;
//   }

//   connect() {
//     return new Promise((resolve, reject) => {
//       this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READONLY, (err) => {
//         if (err) {
//           console.error('❌ Database connection error:', err.message);
//           reject(err);
//         } else {
//           console.log('✅ Connected to SQLite database');
//           resolve(this.db);
//         }
//       });
//     });
//   }

//   query(sql, params = []) {
//     return new Promise((resolve, reject) => {
//       this.db.all(sql, params, (err, rows) => {
//         if (err) {
//           console.error('❌ Query error:', err.message);
//           reject(err);
//         } else {
//           resolve(rows || []);
//         }
//       });
//     });
//   }

//   get(sql, params = []) {
//     return new Promise((resolve, reject) => {
//       this.db.get(sql, params, (err, row) => {
//         if (err) {
//           console.error('❌ Get query error:', err.message);
//           reject(err);
//         } else {
//           resolve(row);
//         }
//       });
//     });
//   }

//   close() {
//     return new Promise((resolve, reject) => {
//       if (this.db) {
//         this.db.close((err) => {
//           if (err) {
//             console.error('❌ Database close error:', err.message);
//             reject(err);
//           } else {
//             console.log('✅ Database connection closed');
//             resolve();
//           }
//         });
//       } else {
//         resolve();
//       }
//     });
//   }
// }

// // Create singleton instance
// const database = new Database();

// // Helper function for executing queries
// const executeQuery = async (sql, params = []) => {
//   try {
//     await database.connect();
//     const rows = await database.query(sql, params);
//     return rows;
//   } catch (error) {
//     throw error;
//   }
// };

// // Surah names mapping
// const getSurahName = (surahNo) => {
//   const surahNames = {
//     1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
//     6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
//     11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
//     16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
//     21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
//     26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
//     31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
//     36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
//     41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
//     46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
//     51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
//     56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
//     61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
//     66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
//     71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
//     76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
//     81: 'التكوير', 82: 'الإنفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
//     86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
//     91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
//     96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
//     101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
//     106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
//     111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
//   };

//   return surahNames[surahNo] || `سورة ${surahNo}`;
// };

// module.exports = {
//   database,
//   executeQuery,
//   getSurahName
// };
const { createClient } = require('@libsql/client');

/* ===========================
   Validation
=========================== */
if (!process.env.TURSO_DB_URL || !process.env.TURSO_DB_AUTH_TOKEN) {
  throw new Error(
    '❌ Missing TURSO_DB_URL or TURSO_DB_AUTH_TOKEN in backend/.env'
  );
}

/* ===========================
   Turso Client
=========================== */
const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_DB_AUTH_TOKEN,
});

let logged = false;
function logOnce() {
  if (!logged) {
    console.log('✅ Connected to Turso (remote SQLite via libSQL)');
    logged = true;
  }
}

/* ===========================
   Query Helpers
=========================== */
async function executeQuery(sql, params = []) {
  logOnce();
  const result = await client.execute({
    sql,
    args: params,
  });
  return result.rows || [];
}

async function executeGet(sql, params = []) {
  logOnce();
  const result = await client.execute({
    sql,
    args: params,
  });
  return result.rows?.[0] ?? null;
}

/* ===========================
   Surah Names (كما كان متوقعًا)
=========================== */
const getSurahName = (surahNo) => {
  const surahNames = {
    1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
    6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
    11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
    16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
    21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
    26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
    31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
    36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
    41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
    46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
    51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
    56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
    61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
    66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
    71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
    76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
    81: 'التكوير', 82: 'الإنفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
    86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
    91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
    96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
    101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
    106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
    111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
  };

  return surahNames[surahNo] || `سورة ${surahNo}`;
};

/* ===========================
   Public API (مطابقة 100%)
=========================== */
module.exports = {
  executeQuery,
  executeGet,
  getSurahName,
};
