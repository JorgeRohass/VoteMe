const { pool } = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';

const getUserRole = async (user) => {
  if (user.role === 'profesor') {
    const profesorResult = await pool.query('SELECT 1 FROM profesores WHERE id_profesor = $1', [user.id]);
    if (profesorResult.rows.length > 0) return 'profesor';
  }

  if (user.role === 'alumno') {
    const alumnoResult = await pool.query('SELECT 1 FROM alumnos WHERE id_alumno = $1', [user.id]);
    if (alumnoResult.rows.length > 0) return 'alumno';
  }

  const profesorResult = await pool.query('SELECT 1 FROM profesores WHERE id_profesor = $1', [user.id]);
  if (profesorResult.rows.length > 0) return 'profesor';

  const alumnoResult = await pool.query('SELECT 1 FROM alumnos WHERE id_alumno = $1', [user.id]);
  if (alumnoResult.rows.length > 0) return 'alumno';

  return 'unknown';
};

const verifySso = async (req, res) => {
  const { id: rut, v } = req.body;
  const verified = String(v || '').toLowerCase();

  if (!rut || !['true', '1', 'yes', 'ok'].includes(verified)) {
    return res.status(400).json({ error: 'Parámetros SSO inválidos' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE rut = $1', [rut]);

    if (result.rows.length === 0) {
      return res.json({ needsRegistration: true, rut });
    }

    const user = result.rows[0];
    const role = await getUserRole(user);

    if (role === 'unknown') {
      return res.status(403).json({ error: 'Usuario no habilitado en la plataforma. Debe estar registrado como profesor o alumno.' });
    }

    const token = jwt.sign({ userId: user.id, rut: user.rut, role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ success: true, token, user: { ...user, role } });
  } catch (error) {
    console.error('Error verifying SSO:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const registerSso = async (req, res) => {
  const { rut, name, email } = req.body;

  if (!rut || !name || !email) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingUser = await client.query('SELECT id FROM users WHERE rut = $1', [rut]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const userResult = await client.query(
      'INSERT INTO users (rut, name, email, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [rut, name, email, 'alumno']
    );

    const user = userResult.rows[0];
    await client.query('INSERT INTO alumnos (id_alumno) VALUES ($1)', [user.id]);

    await client.query('COMMIT');

    const token = jwt.sign({ userId: user.id, rut: user.rut, role: 'alumno' }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ success: true, token, user: { ...user, role: 'alumno' } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registering user:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    res.status(500).json({ error: 'Error del servidor' });
  } finally {
    client.release();
  }
};

const promoteToProfesor = async (req, res) => {
  const { rut } = req.body;

  if (!rut) {
    return res.status(400).json({ error: 'El rut es obligatorio' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE rut = $1', [rut]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    await pool.query('INSERT INTO profesores (id_profesor) VALUES ($1) ON CONFLICT DO NOTHING', [user.id]);
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['profesor', user.id]);

    res.json({ success: true, user: { ...user, role: 'profesor' } });
  } catch (error) {
    console.error('Error promoviendo a profesor:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

const listUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, rut, name, email, role FROM users ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Error del servidor al listar usuarios' });
  }
};

module.exports = {
  verifySso,
  registerSso,
  promoteToProfesor,
  listUsers
};
