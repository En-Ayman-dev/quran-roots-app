// // require('dotenv').config();
// // const express = require('express');
// // const cors = require('cors');
// // const helmet = require('helmet');
// // const compression = require('compression');
// // const morgan = require('morgan');
// // const dotenv = require('dotenv');
// // const path = require('path');

// // // Load environment variables
// // dotenv.config();

// // // Create Express app
// // const app = express();

// // // Middleware
// // app.use(helmet());
// // app.use(compression());
// // app.use(morgan('dev'));
// // app.use(cors({
// //   origin: ['http://localhost:5173', 'http://localhost:3000'],
// //   credentials: true
// // }));
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // // Import routes
// // const searchRoutes = require('./src/routes/searchRoutes');
// // const ayahRoutes = require('./src/routes/ayahRoutes');
// // const surahRoutes = require('./src/routes/surahRoutes');
// // const statisticsRoutes = require('./src/routes/statisticsRoutes');

// // // Use routes
// // app.get('/api', (req, res) => {
// //   res.json({ message: 'Quran Roots API is running' });
// // });

// // app.use('/api/search', searchRoutes);
// // app.use('/api/ayah', ayahRoutes);
// // app.use('/api/surahs', surahRoutes);
// // app.use('/api/statistics', statisticsRoutes);

// // // Health check endpoint
// // app.get('/health', (req, res) => {
// //   res.json({
// //     status: 'healthy',
// //     timestamp: new Date().toISOString(),
// //     version: '1.0.0'
// //   });
// // });

// // // Error handling middleware
// // app.use((err, req, res, next) => {
// //   console.error(err.stack);
// //   res.status(err.status || 500).json({
// //     error: {
// //       message: err.message || 'Internal Server Error',
// //       ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
// //     }
// //   });
// // });

// // // 404 handler
// // app.use('*', (req, res) => {
// //   res.status(404).json({ error: 'Route not found' });
// // });

// // // Start server
// // const PORT = process.env.PORT || 3002;

// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on port ${PORT}`);
// //   console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
// //   console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
// // });

// // module.exports = app;
// // backend/server.js
// require('dotenv').config();

// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const compression = require('compression');
// const morgan = require('morgan');
// // const rateLimit = require('express-rate-limit'); // Temporarily disabled due to install issues
// const path = require('path');

// const app = express();

// // Middleware: CORS (MUST BE FIRST)
// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Allow requests with no origin (like curl) IF they pass source verification
//       if (!origin) return callback(null, true);

//       const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

//       // Check if origin is in allowed list or is a Vercel app
//       if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
//         callback(null, true);
//       } else {
//         console.log('Blocked by CORS:', origin);
//         callback(new Error('Not allowed by CORS'));
//       }
//     },
//     credentials: true,
//   })
// );

// // Security Middleware: Helmet
// app.use(helmet());

// // Security Middleware: Source Verification
// const verifySource = (req, res, next) => {
//   // Allow health check and preflight OPTIONS without header
//   if (req.path === '/health' || req.path === '/api/health' || req.method === 'OPTIONS') return next();

//   const appSource = req.headers['x-app-source'];
//   const expectedSource = 'quran-roots-client-v1'; // This should match frontend

//   if (appSource !== expectedSource) {
//     // Log unauthorized attempts (optional: use a proper logger)
//     console.warn(`Unauthorized access attempt from IP: ${req.ip} - Path: ${req.path}`);
//     return res.status(403).json({ error: 'Access Denied: Unauthorized Source' });
//   }
//   next();
// };

// app.use(verifySource);

// // Middleware Common
// app.use(compression());
// app.use(morgan('dev'));

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Secure Static Resource Endpoint
// app.get('/api/resources/word-index', (req, res) => {
//   const filePath = path.join(__dirname, 'data', 'word_index.json');
//   res.sendFile(filePath, (err) => {
//     if (err) {
//       console.error('Error serving word index:', err);
//       res.status(500).json({ error: 'Failed to load resource' });
//     }
//   });
// });

// // Import routes
// const searchRoutes = require('./src/routes/searchRoutes');
// const ayahRoutes = require('./src/routes/ayahRoutes');
// const surahRoutes = require('./src/routes/surahRoutes');
// const statisticsRoutes = require('./src/routes/statisticsRoutes');

// // Use routes
// app.get('/api', (req, res) => {
//   res.json({ message: 'Quran Roots API is running' });
// });

// app.use('/api/search', searchRoutes);
// app.use('/api/ayah', ayahRoutes);
// app.use('/api/surahs', surahRoutes);
// app.use('/api/statistics', statisticsRoutes);

// // Health check endpoint (Publicly accessible logically, but protected by verifySource exception above)
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'healthy',
//     timestamp: new Date().toISOString(),
//     version: '1.0.0',
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(err.status || 500).json({
//     error: {
//       message: err.message || 'Internal Server Error',
//       ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
//     },
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// // Start server
// const PORT = process.env.PORT || 3002;

// app.listen(PORT, () => {
//   // Server initialized (Optimization Complete)
//   console.log(`🚀 Server running on port ${PORT}`);
//   console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
//   console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
// });

// module.exports = app;
