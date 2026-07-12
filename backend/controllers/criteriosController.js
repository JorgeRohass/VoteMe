const { pool } = require('../db');

const DEFAULT_TIPO_ESCALA = 'por defecto';
const DEFAULT_VALOR_MAXIMO = 7;

const calculateEqualPonderacion = (totalCriterios) => {
  if (totalCriterios <= 0) return 0;
  return Number((100 / totalCriterios).toFixed(2));
};

const recalculatePonderaciones = async (client, idEvaluacion) => {
  const criteriosResult = await client.query(
    'SELECT id_criterio FROM criterios_evaluacion WHERE id_evaluacion = $1 ORDER BY id_criterio',
    [idEvaluacion]
  );

  const ponderacion = calculateEqualPonderacion(criteriosResult.rows.length);

  for (const criterio of criteriosResult.rows) {
    await client.query(
      `UPDATE criterios_evaluacion
       SET ponderacion = $1,
           tipo_escala = $2,
           valor_maximo = $3
       WHERE id_criterio = $4`,
      [ponderacion, DEFAULT_TIPO_ESCALA, DEFAULT_VALOR_MAXIMO, criterio.id_criterio]
    );
  }
};

const listCriterios = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM criterios_evaluacion ORDER BY id_evaluacion, id_criterio'
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing criterios:', error);
    res.status(500).json({ error: 'No se pudieron obtener los criterios de evaluación' });
  }
};

const listCriteriosByEvaluacion = async (req, res) => {
  const { id_evaluacion } = req.params;

  try {
    const evaluacionResult = await pool.query(
      'SELECT id_evaluacion FROM evaluaciones WHERE id_evaluacion = $1',
      [id_evaluacion]
    );

    if (evaluacionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const result = await pool.query(
      'SELECT * FROM criterios_evaluacion WHERE id_evaluacion = $1 ORDER BY id_criterio',
      [id_evaluacion]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing criterios by evaluacion:', error);
    res.status(500).json({ error: 'No se pudieron obtener los criterios de la evaluación' });
  }
};

const getCriterioById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM criterios_evaluacion WHERE id_criterio = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Criterio de evaluación no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting criterio by id:', error);
    res.status(500).json({ error: 'No se pudo obtener el criterio de evaluación' });
  }
};

const createCriterio = async (req, res) => {
  const { nombre, descripcion, id_evaluacion } = req.body;

  if (!nombre || !id_evaluacion) {
    return res.status(400).json({ error: 'El nombre y el id_evaluacion son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const evaluacionResult = await client.query(
      'SELECT id_evaluacion FROM evaluaciones WHERE id_evaluacion = $1',
      [id_evaluacion]
    );

    if (evaluacionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const result = await client.query(
      `INSERT INTO criterios_evaluacion
        (nombre, descripcion, ponderacion, tipo_escala, valor_maximo, id_evaluacion)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        String(nombre).trim(),
        descripcion || null,
        0,
        DEFAULT_TIPO_ESCALA,
        DEFAULT_VALOR_MAXIMO,
        id_evaluacion,
      ]
    );

    await recalculatePonderaciones(client, id_evaluacion);
    const criterioResult = await client.query(
      'SELECT * FROM criterios_evaluacion WHERE id_criterio = $1',
      [result.rows[0].id_criterio]
    );

    await client.query('COMMIT');
    res.status(201).json(criterioResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating criterio:', error);
    res.status(500).json({ error: 'No se pudo crear el criterio de evaluación' });
  } finally {
    client.release();
  }
};

const updateCriterio = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, id_evaluacion } = req.body;

  if (!nombre || !id_evaluacion) {
    return res.status(400).json({ error: 'El nombre y el id_evaluacion son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const evaluacionResult = await client.query(
      'SELECT id_evaluacion FROM evaluaciones WHERE id_evaluacion = $1',
      [id_evaluacion]
    );

    if (evaluacionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const result = await client.query(
      `UPDATE criterios_evaluacion
       SET nombre = $1,
           descripcion = $2,
           tipo_escala = $3,
           valor_maximo = $4,
           id_evaluacion = $5
       WHERE id_criterio = $6
       RETURNING *`,
      [
        String(nombre).trim(),
        descripcion || null,
        DEFAULT_TIPO_ESCALA,
        DEFAULT_VALOR_MAXIMO,
        id_evaluacion,
        id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Criterio de evaluación no encontrado' });
    }

    await recalculatePonderaciones(client, id_evaluacion);
    const criterioResult = await client.query(
      'SELECT * FROM criterios_evaluacion WHERE id_criterio = $1',
      [id]
    );

    await client.query('COMMIT');
    res.json(criterioResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating criterio:', error);
    res.status(500).json({ error: 'No se pudo actualizar el criterio de evaluación' });
  } finally {
    client.release();
  }
};

const deleteCriterio = async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'DELETE FROM criterios_evaluacion WHERE id_criterio = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Criterio de evaluación no encontrado' });
    }

    await recalculatePonderaciones(client, result.rows[0].id_evaluacion);
    await client.query('COMMIT');

    res.json({ message: 'Criterio de evaluación eliminado correctamente', criterio: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting criterio:', error);
    res.status(500).json({ error: 'No se pudo eliminar el criterio de evaluación' });
  } finally {
    client.release();
  }
};

module.exports = {
  listCriterios,
  listCriteriosByEvaluacion,
  getCriterioById,
  createCriterio,
  updateCriterio,
  deleteCriterio,
};
