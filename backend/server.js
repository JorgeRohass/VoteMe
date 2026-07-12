const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { checkConnection, initDb } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
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
