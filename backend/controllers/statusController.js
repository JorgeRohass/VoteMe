const { pool } = require('../db');

const getStatus = async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.json({
      status: 'success',
      message: 'Backend is running and connected to Neon Database!',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to the database',
      error: error.message || 'Unknown error'
    });
  }
};

module.exports = {
  getStatus
};
