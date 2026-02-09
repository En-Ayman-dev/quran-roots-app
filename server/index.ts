import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import { createRequire } from "module";

// Initialize Environment
dotenv.config();

// ESM Compatibility Helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url); // Enable CommonJS imports

// Import Legacy Routes (Bridging Logic)
// We assume these files exist in backend/src/routes. 
// We need to adjust paths since server/index.ts is in /server and old routes are in /backend
const backendPath = path.join(__dirname, "../backend");
const searchRoutes = require(path.join(backendPath, "src/routes/searchRoutes"));
const ayahRoutes = require(path.join(backendPath, "src/routes/ayahRoutes"));
const surahRoutes = require(path.join(backendPath, "src/routes/surahRoutes"));
const statisticsRoutes = require(path.join(backendPath, "src/routes/statisticsRoutes"));

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT || 3002;

  // --- 1. Security Middleware (Crucial) ---

  // CORS Configuration
  app.use(cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like curl) or same-origin
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3002' // Legacy port just in case
      ];

      // Check if origin is allowed or is a Vercel app
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  app.use(helmet({
    contentSecurityPolicy: false, // Disable for dev/mixed content flexibility if needed
  }));

  // --- 2. Custom Security Gate (The "Hard Gate") ---
  const verifySource = (req: Request, res: Response, next: NextFunction) => {
    // Exceptions for health, static assets, and preflight
    if (
      req.path === '/health' ||
      req.path === '/api/health' ||
      req.path.startsWith('/assets') || // Frontend assets
      req.method === 'OPTIONS'
    ) return next();

    // In a monolithic deployment (serving frontend from same origin), 
    // headers might not be sent by browser navigation.
    // We relax this ONLY for non-API routes (frontend pages).
    if (!req.path.startsWith('/api')) return next();

    const appSource = req.headers['x-app-source'];
    const expectedSource = 'quran-roots-client-v1';

    if (appSource !== expectedSource) {
      console.warn(`Unauthorized access attempt from IP: ${req.ip} - Path: ${req.path}`);
      return res.status(403).json({ error: 'Access Denied: Unauthorized Source' });
    }
    next();
  };

  app.use(verifySource);

  // --- 3. Standard Middleware ---
  app.use(compression());
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- 4. API Routes (The Brain) ---

  // Health Check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0 (Unified)',
    });
  });

  // Resource Endpoint (Word Index)
  app.get('/api/resources/word-index', (_req, res) => {
    const filePath = path.join(backendPath, 'data', 'word_index.json');
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving word index:', err);
        res.status(500).json({ error: 'Failed to load resource' });
      }
    });
  });

  // Mount API Routes
  app.use('/api/search', searchRoutes);
  app.use('/api/ayah', ayahRoutes);
  app.use('/api/surahs', surahRoutes);
  app.use('/api/statistics', statisticsRoutes);

  // Root API Check
  app.get('/api', (_req, res) => {
    res.json({ message: 'Quran Roots API is running (Unified Mode)' });
  });

  // --- 5. Frontend Serving (The Face) ---
  // Serve static files from the client build directory
  // Assuming build output is in 'dist/public' or similar based on setup
  // For now, we point to '../dist' or '../client/dist'
  const frontendPath = path.join(__dirname, "../dist");
  app.use(express.static(frontendPath));

  // Fallback for SPA routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // 404 for API
    }
    res.sendFile(path.join(frontendPath, "index.html"), (err) => {
      if (err) {
        // If index.html doesn't exist (dev mode or bad build), fallback nicely
        res.status(404).send("Frontend build not found. Please run build script.");
      }
    });
  });

  // --- 6. Error Handling ---
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  });

  // Start Listener
  server.listen(PORT, () => {
    console.log(`🚀 Unified Server running on port ${PORT}`);
    console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
  });
}

startServer().catch(console.error);