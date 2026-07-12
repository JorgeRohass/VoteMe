const { pool } = require('../db');

const generateRandomCode = () =>
  Math.random().toString(36).slice(2, 8).toUpperCase();

const listSessionCodes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id_sesion, s.codigo, s.estado, s.created_at,
             g.id_grupo, g.nombre AS grupo
      FROM sesiones s
      JOIN grupos g ON g.id_grupo = s.id_grupo
      ORDER BY s.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing session codes:', error);
    res.status(500).json({ error: 'No se pudieron obtener los códigos de sesión' });
  }
};

const createSessionCode = async (req, res) => {
  try {
    const { id_grupo, id_evaluacion, codigo = generateRandomCode() } = req.body;

    if (!id_grupo) {
      return res.status(400).json({ error: 'El id_grupo es obligatorio' });
    }

    const grupo = await pool.query('SELECT id_grupo FROM grupos WHERE id_grupo = $1', [id_grupo]);
    if (grupo.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Calcular expiración a 30 minutos
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const result = await pool.query(
      'INSERT INTO sesiones (codigo, id_grupo, id_evaluacion, estado, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [String(codigo).trim().toUpperCase(), id_grupo, id_evaluacion || null, 'activo', expiresAt]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El código de sesión ya existe' });
    }

    console.error('Error creating session code:', error);
    res.status(500).json({ error: 'No se pudo crear el código de sesión' });
  }
};

const validateSessionCode = async (req, res) => {
  try {
    const { codigo } = req.params;

    const result = await pool.query(`
      SELECT s.*, g.nombre AS grupo
      FROM sesiones s
      JOIN grupos g ON g.id_grupo = s.id_grupo
      WHERE s.codigo = $1 AND s.estado = 'activo'
    `, [String(codigo).trim().toUpperCase()]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Código de sesión inválido o inactivo' });
    }

    const session = result.rows[0];

    // Verificar si expiró
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      // Marcar inactivo opcionalmente
      await pool.query('UPDATE sesiones SET estado = $1 WHERE id_sesion = $2', ['expirado', session.id_sesion]);
      return res.status(403).json({ error: 'El código de sesión ha expirado' });
    }

    res.json({ valid: true, session });
  } catch (error) {
    console.error('Error validating session code:', error);
    res.status(500).json({ error: 'No se pudo validar el código de sesión' });
  }
};

module.exports = {
  listSessionCodes,
  createSessionCode,
  validateSessionCode,
};
