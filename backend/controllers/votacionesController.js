const { pool } = require('../db');

const listVotes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM votaciones ORDER BY fecha_hora DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing votes:', error);
    res.status(500).json({ error: 'No se pudieron obtener las votaciones' });
  }
};

const createVote = async (req, res) => {
  try {
    const {
      valor,
      comentario,
      id_alumno,
      id_evaluacion,
      id_alumno_evaluado,
      id_grupo_evaluado,
    } = req.body;

    if (!id_alumno || !id_evaluacion || valor === undefined) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para registrar la votación' });
    }

    const result = await pool.query(
      `INSERT INTO votaciones
        (valor, comentario, id_alumno, id_evaluacion, id_alumno_evaluado, id_grupo_evaluado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [valor, comentario || null, id_alumno, id_evaluacion, id_alumno_evaluado || null, id_grupo_evaluado || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vote:', error);
    res.status(500).json({ error: 'No se pudo registrar la votación' });
  }
};

module.exports = {
  listVotes,
  createVote,
};
