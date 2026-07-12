const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { checkConnection, initDb } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://vote-me-front.vercel.app',
  'https://vote-me-front-git-main-jorgerohass-projects.vercel.app',
  'https://vote-me-front-ft6h66dm1-jorgerohass-projects.vercel.app',
  'https://vote-me-front-f1u6h4pf5-jorgerohass-projects.vercel.app',
  'https://vote-me-front-cy9xqpzmo-jorgerohass-projects.vercel.app'
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /https:\/\/.*\.vercel\.app$/i.test(origin) || /http:\/\/localhost(:\d+)?$/i.test(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

let dbReady = false;
let dbBootstrapPromise = null;

const ensureDbReady = async () => {
  if (dbReady) return;

  if (!dbBootstrapPromise) {
    dbBootstrapPromise = (async () => {
      try {
        await checkConnection();
        await initDb();
        dbReady = true;
      } catch (err) {
        console.error('❌ Startup failed:', err);
        throw err;
      }
    })();
  }

  return dbBootstrapPromise;
};

app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  try {
    await ensureDbReady();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

// Rutas
app.use('/api', routes);

if (require.main === module) {
  (async () => {
    try {
      await ensureDbReady();
      app.listen(port, () => {
        console.log(`🚀 Backend server is running on http://localhost:${port}`);
      });
    } catch (err) {
      process.exit(1);
    }
  })();
}

module.exports = app;
