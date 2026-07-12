const { pool } = require('../db');

const listGroups = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grupos ORDER BY id_grupo');
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing groups:', error);
    res.status(500).json({ error: 'No se pudieron obtener los grupos' });
  }
};

const getGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM grupos WHERE id_grupo = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting group:', error);
    res.status(500).json({ error: 'No se pudo obtener el grupo' });
  }
};

const createGroup = async (req, res) => {
  try {
    const { nombre, descripcion, id_evaluacion } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
    }

    const result = await pool.query(
      'INSERT INTO grupos (nombre, descripcion, id_evaluacion) VALUES ($1, $2, $3) RETURNING *',
      [nombre, descripcion || null, id_evaluacion || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'No se pudo crear el grupo' });
  }
};

module.exports = {
  listGroups,
  getGroup,
  createGroup,
};
