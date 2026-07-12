const { pool } = require('../db');
const crypto = require('crypto');

const DEFAULT_TIPO_ESCALA = 'por defecto';
const DEFAULT_VALOR_MAXIMO = 7;

const calculateEqualPonderacion = (totalCriterios) => {
  if (totalCriterios <= 0) return 0;
  return Number((100 / totalCriterios).toFixed(2));
};

// Generar código único de 6 caracteres
const generateSessionCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Obtener los criterios de una evaluación
const getEvaluacionCriterios = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM criterios_evaluacion WHERE id_evaluacion = $1 ORDER BY id_criterio ASC', [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching criterios:', error);
    res.status(500).json({ error: 'No se pudieron obtener los criterios' });
  }
};

// Crear o actualizar criterios de una evaluación
const saveEvaluacionCriterios = async (req, res) => {
  const { id } = req.params;
  const { criterios } = req.body; // Array de { nombre, descripcion }

  if (!Array.isArray(criterios)) {
    return res.status(400).json({ error: 'Formato de criterios inválido' });
  }

  if (criterios.length === 0) {
    return res.status(400).json({ error: 'Debe agregar al menos un criterio' });
  }

  const criteriosValidos = criterios.map((criterio) => ({
    nombre: String(criterio.nombre || '').trim(),
    descripcion: criterio.descripcion || null,
  }));

  if (criteriosValidos.some((criterio) => !criterio.nombre)) {
    return res.status(400).json({ error: 'Todos los criterios deben tener nombre' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const evaluacionResult = await client.query('SELECT id_evaluacion FROM evaluaciones WHERE id_evaluacion = $1', [id]);
    if (evaluacionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    await client.query('DELETE FROM criterios_evaluacion WHERE id_evaluacion = $1', [id]);

    const inserted = [];
    const ponderacion = calculateEqualPonderacion(criteriosValidos.length);

    for (const c of criteriosValidos) {
      const resC = await client.query(
        'INSERT INTO criterios_evaluacion (id_evaluacion, nombre, descripcion, ponderacion, tipo_escala, valor_maximo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, c.nombre, c.descripcion, ponderacion, DEFAULT_TIPO_ESCALA, DEFAULT_VALOR_MAXIMO]
      );
      inserted.push(resC.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, criterios: inserted });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving criterios:', error);
    res.status(500).json({ error: 'No se pudieron guardar los criterios' });
  } finally {
    client.release();
  }
};

// Enviar respuestas de la evaluación (Alumno evaluador)
const submitRespuestas = async (req, res) => {
  const { id_sesion, respuestas, nombre_evaluador, rut_evaluador } = req.body; 
  // respuestas: [{ id_criterio, valor_asignado, comentario }]

  if (!id_sesion || !Array.isArray(respuestas)) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Validar que la sesión esté activa y no expirada
    const sesionResult = await client.query('SELECT * FROM sesiones WHERE id_sesion = $1 AND estado = $2', [id_sesion, 'activo']);
    if (sesionResult.rows.length === 0) {
      throw new Error('Sesión inactiva o no encontrada');
    }
    const session = sesionResult.rows[0];
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      throw new Error('Sesión expirada');
    }

    for (const r of respuestas) {
      await client.query(
        'INSERT INTO respuestas_evaluacion (id_sesion, id_criterio, valor_asignado, comentario, nombre_evaluador, rut_evaluador) VALUES ($1, $2, $3, $4, $5, $6)',
        [id_sesion, r.id_criterio, r.valor_asignado, r.comentario || null, nombre_evaluador || null, rut_evaluador || null]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: 'Respuestas enviadas correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting respuestas:', error);
    res.status(500).json({ error: error.message || 'Error guardando respuestas' });
  } finally {
    client.release();
  }
};

// Generar sesión de evaluación para un grupo
const createSession = async (req, res) => {
  const { id_evaluacion, id_grupo } = req.body;

  if (!id_evaluacion || !id_grupo) {
    return res.status(400).json({ error: 'id_evaluacion e id_grupo son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que el grupo existe y está asociado a la evaluación
    const evalGroupResult = await client.query(
      'SELECT * FROM evaluacion_grupo WHERE id_evaluacion = $1 AND id_grupo = $2',
      [id_evaluacion, id_grupo]
    );

    if (evalGroupResult.rows.length === 0) {
      throw new Error('El grupo no está asociado a esta evaluación');
    }

    // Generar código único
    let codigo;
    let codigoExists;
    do {
      codigo = generateSessionCode();
      const codigoResult = await client.query('SELECT codigo FROM sesiones WHERE codigo = $1', [codigo]);
      codigoExists = codigoResult.rows.length > 0;
    } while (codigoExists);

    // Calcular fecha de expiración (30 minutos)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    // Insertar sesión
    const result = await client.query(
      'INSERT INTO sesiones (codigo, estado, expires_at, id_grupo, id_evaluacion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [codigo, 'activo', expiresAt, id_grupo, id_evaluacion]
    );

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message || 'No se pudo crear la sesión' });
  } finally {
    client.release();
  }
};

// Obtener sesión por código
const getSessionByCode = async (req, res) => {
  const { codigo } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM sesiones WHERE codigo = $1 AND estado = $2',
      [codigo, 'activo']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada o inactiva' });
    }

    const session = result.rows[0];

    // Verificar expiración
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Sesión expirada' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'No se pudo obtener la sesión' });
  }
};

// Obtener evaluaciones de un grupo
const getGroupEvaluations = async (req, res) => {
  const { id_grupo } = req.params;

  try {
    const result = await pool.query(`
      SELECT eg.*, e.titulo, e.descripcion, e.fecha_inicio, e.fecha_fin
      FROM evaluacion_grupo eg
      JOIN evaluaciones e ON eg.id_evaluacion = e.id_evaluacion
      WHERE eg.id_grupo = $1
      ORDER BY e.fecha_inicio ASC
    `, [id_grupo]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching group evaluations:', error);
    res.status(500).json({ error: 'No se pudieron obtener las evaluaciones del grupo' });
  }
};

// Calcular nota final de un grupo en una evaluación
const calculateGroupGrade = async (req, res) => {
  const { id_evaluacion, id_grupo } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener criterios de la evaluación
    const criteriosResult = await client.query(
      'SELECT * FROM criterios_evaluacion WHERE id_evaluacion = $1',
      [id_evaluacion]
    );

    if (criteriosResult.rows.length === 0) {
      throw new Error('No hay criterios configurados para esta evaluación');
    }

    const criterios = criteriosResult.rows;

    // Obtener sesión activa para este grupo y evaluación
    const sessionResult = await client.query(
      'SELECT id_sesion FROM sesiones WHERE id_evaluacion = $1 AND id_grupo = $2 AND estado = $3 ORDER BY created_at DESC LIMIT 1',
      [id_evaluacion, id_grupo, 'activo']
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('No hay sesión activa para esta evaluación');
    }

    const sessionId = sessionResult.rows[0].id_sesion;

    // Calcular promedio por criterio
    let notaFinal = 0;
    const criteriosNotas = [];

    for (const criterio of criterios) {
      const respuestasResult = await client.query(
        'SELECT valor_asignado FROM respuestas_evaluacion WHERE id_sesion = $1 AND id_criterio = $2',
        [sessionId, criterio.id_criterio]
      );

      if (respuestasResult.rows.length === 0) {
        criteriosNotas.push({
          id_criterio: criterio.id_criterio,
          nombre: criterio.nombre,
          promedio: 0,
          ponderacion: criterio.ponderacion
        });
        continue;
      }

      const valores = respuestasResult.rows.map(r => parseFloat(r.valor_asignado));
      const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;
      const ponderado = promedio * (criterio.ponderacion / 100);

      criteriosNotas.push({
        id_criterio: criterio.id_criterio,
        nombre: criterio.nombre,
        promedio: promedio,
        ponderacion: criterio.ponderacion,
        nota_ponderada: ponderado
      });

      notaFinal += ponderado;
    }

    // Actualizar nota final en evaluacion_grupo
    await client.query(
      'UPDATE evaluacion_grupo SET nota_final = $1 WHERE id_evaluacion = $2 AND id_grupo = $3',
      [notaFinal, id_evaluacion, id_grupo]
    );

    await client.query('COMMIT');
    res.json({
      nota_final: notaFinal,
      criterios: criteriosNotas
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error calculating grade:', error);
    res.status(500).json({ error: error.message || 'No se pudo calcular la nota' });
  } finally {
    client.release();
  }
};

// Obtener resultados de evaluación de un grupo
const getGroupEvaluationResults = async (req, res) => {
  const { id_evaluacion, id_grupo } = req.params;

  try {
    const result = await pool.query(`
      SELECT eg.*, e.titulo as evaluacion_titulo, g.nombre as grupo_nombre
      FROM evaluacion_grupo eg
      JOIN evaluaciones e ON eg.id_evaluacion = e.id_evaluacion
      JOIN grupos g ON eg.id_grupo = g.id_grupo
      WHERE eg.id_evaluacion = $1 AND eg.id_grupo = $2
    `, [id_evaluacion, id_grupo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const evaluacionGrupo = result.rows[0];

    // Obtener todas las respuestas con información de evaluadores
    const respuestasResult = await pool.query(`
      SELECT r.*, c.nombre as criterio_nombre, s.codigo as codigo_sesion
      FROM respuestas_evaluacion r
      JOIN criterios_evaluacion c ON r.id_criterio = c.id_criterio
      JOIN sesiones s ON r.id_sesion = s.id_sesion
      WHERE s.id_evaluacion = $1 AND s.id_grupo = $2
    `, [id_evaluacion, id_grupo]);

    res.json({
      ...evaluacionGrupo,
      respuestas: respuestasResult.rows
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'No se pudieron obtener los resultados' });
  }
};

// Obtener evaluación por ID
const getEvaluacionById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM evaluaciones WHERE id_evaluacion = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting evaluacion by id:', error);
    res.status(500).json({ error: 'No se pudo obtener la evaluación' });
  }
};

// Crear o actualizar relación evaluacion-grupo
const linkGroupToEvaluation = async (req, res) => {
  const { id_evaluacion, id_grupo } = req.body;

  if (!id_evaluacion || !id_grupo) {
    return res.status(400).json({ error: 'id_evaluacion e id_grupo son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar si ya existe la relación
    const existingResult = await client.query(
      'SELECT * FROM evaluacion_grupo WHERE id_evaluacion = $1 AND id_grupo = $2',
      [id_evaluacion, id_grupo]
    );

    if (existingResult.rows.length === 0) {
      // Crear nueva relación
      const result = await client.query(
        'INSERT INTO evaluacion_grupo (id_evaluacion, id_grupo, estado) VALUES ($1, $2, $3) RETURNING *',
        [id_evaluacion, id_grupo, 'pendiente']
      );
      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);
    } else {
      await client.query('ROLLBACK');
      res.json(existingResult.rows[0]);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error linking group to evaluation:', error);
    res.status(500).json({ error: 'No se pudo vincular el grupo a la evaluación' });
  } finally {
    client.release();
  }
};

module.exports = {
  getEvaluacionCriterios,
  saveEvaluacionCriterios,
  submitRespuestas,
  createSession,
  getSessionByCode,
  getGroupEvaluations,
  calculateGroupGrade,
  getGroupEvaluationResults,
  getEvaluacionById,
  linkGroupToEvaluation
};
