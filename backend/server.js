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

// Verificamos conexión a DB e inicializamos tablas al arrancar
const startServer = async () => {
  try {
    await checkConnection();
    await initDb();
  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
};

startServer();

// Rutas
app.use('/api', routes);

app.listen(port, () => {
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
});
