const { pool } = require('../db');
const XLSX = require('xlsx');
const fs = require('fs');

const listRamos = async (req, res) => {
  const { id_profesor } = req.query;

  if (!id_profesor) {
    return res.status(400).json({ error: 'El id_profesor es obligatorio' });
  }

  try {
    const result = await pool.query(
      'SELECT id_ramo, nombre, descripcion, creditos, id_profesor FROM ramos WHERE id_profesor = $1 ORDER BY id_ramo',
      [id_profesor]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing ramos:', error);
    res.status(500).json({ error: 'No se pudieron obtener los ramos' });
  }
};

const getRamoById = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'El id del ramo es obligatorio' });
  }

  try {
    const result = await pool.query(
      'SELECT id_ramo, nombre, descripcion, creditos, id_profesor FROM ramos WHERE id_ramo = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ramo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting ramo by id:', error);
    res.status(500).json({ error: 'No se pudo obtener el ramo' });
  }
};

const createRamo = async (req, res) => {
  const { nombre, descripcion, creditos, id_profesor } = req.body;

  if (!nombre || !id_profesor) {
    return res.status(400).json({ error: 'El nombre y el id_profesor son obligatorios' });
  }

  const creditosValor = creditos !== undefined && creditos !== null ? Number(creditos) : null;
  if (creditos !== null && creditos !== undefined && Number.isNaN(creditosValor)) {
    return res.status(400).json({ error: 'Los créditos deben ser un número válido' });
  }

  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [id_profesor]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Profesor no encontrado' });
    }

    if (userResult.rows[0].role !== 'profesor') {
      return res.status(403).json({ error: 'El usuario no está registrado como profesor' });
    }

    const profesorResult = await pool.query('SELECT 1 FROM profesores WHERE id_profesor = $1', [id_profesor]);
    if (profesorResult.rows.length === 0) {
      await pool.query('INSERT INTO profesores (id_profesor) VALUES ($1)', [id_profesor]);
    }

    const result = await pool.query(
      'INSERT INTO ramos (nombre, descripcion, creditos, id_profesor) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion || null, creditosValor, id_profesor]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ramo:', error);
    res.status(500).json({ error: 'No se pudo crear el ramo' });
  }
};

const addStudentToRamo = async (req, res) => {
  const { id } = req.params;
  const { identifier } = req.body; // Puede ser RUT o Email

  if (!identifier) {
    return res.status(400).json({ error: 'El RUT o Email es obligatorio' });
  }

  try {
    // 1. Buscar al usuario
    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE rut = $1 OR email = $1',
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // 2. Asegurarse de que esté en la tabla de alumnos si su rol lo permite o si no, registrarlo como alumno
    const alumnoResult = await pool.query('SELECT id_alumno FROM alumnos WHERE id_alumno = $1', [user.id]);
    if (alumnoResult.rows.length === 0) {
      await pool.query('INSERT INTO alumnos (id_alumno) VALUES ($1)', [user.id]);
    }

    // 3. Crear la inscripción
    await pool.query(
      'INSERT INTO inscripciones (id_alumno, id_ramo) VALUES ($1, $2)',
      [user.id, id]
    );

    res.status(201).json({ message: 'Alumno inscrito correctamente', id_alumno: user.id });
  } catch (error) {
    console.error('Error adding student to ramo:', error);
    if (error.code === '23505') { // UNIQUE constraint violation (unique_alumno_ramo)
      return res.status(400).json({ error: 'El alumno ya está inscrito en este ramo' });
    }
    res.status(500).json({ error: 'No se pudo inscribir al alumno' });
  }
};

const getRamoStudents = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT u.id, u.rut, u.name, u.email, i.fecha_inscripcion, i.estado
      FROM users u
      JOIN inscripciones i ON u.id = i.id_alumno
      WHERE i.id_ramo = $1
      ORDER BY u.name
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting students of ramo:', error);
    res.status(500).json({ error: 'No se pudieron obtener los alumnos del ramo' });
  }
};

const getRamoGroups = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT g.*, 
             COALESCE(
               json_agg(
                 json_build_object('id', u.id, 'name', u.name, 'email', u.email)
               ) FILTER (WHERE u.id IS NOT NULL), '[]'
             ) as alumnos
      FROM grupos g
      LEFT JOIN alumno_grupo ag ON g.id_grupo = ag.id_grupo
      LEFT JOIN users u ON ag.id_alumno = u.id
      WHERE g.id_ramo = $1
      GROUP BY g.id_grupo
      ORDER BY g.nombre
    `, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting groups of ramo:', error);
    res.status(500).json({ error: 'No se pudieron obtener los grupos del ramo' });
  }
};

const createRamoGroup = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, max_alumnos, alumnos } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }

  const maxAlumnosVal = max_alumnos ? parseInt(max_alumnos, 10) : 0;
  
  if (maxAlumnosVal > 0 && alumnos && alumnos.length > maxAlumnosVal) {
    return res.status(400).json({ error: `El número de alumnos (${alumnos.length}) excede el máximo permitido (${maxAlumnosVal})` });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      'INSERT INTO grupos (nombre, descripcion, id_ramo, max_alumnos) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion || null, id, maxAlumnosVal]
    );
    const newGroup = result.rows[0];

    if (alumnos && Array.isArray(alumnos) && alumnos.length > 0) {
      for (const alumnoId of alumnos) {
        await client.query(
          'INSERT INTO alumno_grupo (id_alumno, id_grupo) VALUES ($1, $2)',
          [alumnoId, newGroup.id_grupo]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(newGroup);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating group for ramo:', error);
    res.status(500).json({ error: 'No se pudo crear el grupo para este ramo' });
  } finally {
    client.release();
  }
};

const getRamoEvaluaciones = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM evaluaciones WHERE id_ramo = $1 ORDER BY fecha_inicio ASC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting evaluaciones of ramo:', error);
    res.status(500).json({ error: 'No se pudieron obtener las evaluaciones del ramo' });
  }
};

const createRamoEvaluacion = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, tipo, fecha_inicio, fecha_fin } = req.body;

  if (!titulo || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'El título, fecha de inicio y fecha de fin son obligatorios' });
  }

  const evalTipo = tipo || 'grupal';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO evaluaciones (titulo, descripcion, tipo, fecha_inicio, fecha_fin, id_ramo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [titulo, descripcion || null, evalTipo, fecha_inicio, fecha_fin, id]
    );
    const newEvaluacion = result.rows[0];

    // Ligar automáticamente todos los grupos existentes de este ramo a esta nueva evaluación
    const groupsResult = await client.query('SELECT id_grupo FROM grupos WHERE id_ramo = $1', [id]);
    
    for (const group of groupsResult.rows) {
      await client.query(
        'INSERT INTO evaluacion_grupo (id_evaluacion, id_grupo, estado) VALUES ($1, $2, $3)',
        [newEvaluacion.id_evaluacion, group.id_grupo, 'pendiente']
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newEvaluacion);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating evaluacion for ramo:', error);
    res.status(500).json({ error: 'No se pudo crear la evaluación para este ramo' });
  } finally {
    client.release();
  }
};

const importStudentsFromExcelToRamo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const { id } = req.params;

    if (!id) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El ID del ramo es obligatorio' });
    }

    // Validar que exista el ramo
    const ramoCheck = await pool.query('SELECT * FROM ramos WHERE id_ramo = $1', [id]);
    if (ramoCheck.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Ramo no encontrado' });
    }

    // Leer el archivo Excel
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Validar que el archivo no esté vacío
    if (!data || data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El archivo Excel está vacío' });
    }

    // Procesar cada fila
    const results = {
      successful: [],
      failed: [],
      duplicates: [],
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const nombre = row.nombre?.toString().trim();
        const rut = row.rut?.toString().trim();
        const correo = row.correo?.toString().trim();

        // Validaciones básicas
        if (!nombre || !rut || !correo) {
          results.failed.push({
            fila: i + 2,
            datos: row,
            error: 'Faltan campos requeridos (nombre, rut, correo)',
          });
          continue;
        }

        try {
          // Verificar si el usuario ya existe
          const userCheck = await client.query(
            'SELECT id FROM users WHERE rut = $1',
            [rut]
          );

          let userId;

          if (userCheck.rows.length > 0) {
            // Usuario ya existe
            userId = userCheck.rows[0].id;

            // Verificar si ya está inscrito en el ramo
            const inscripcionCheck = await client.query(
              'SELECT * FROM inscripciones WHERE id_alumno = $1 AND id_ramo = $2',
              [userId, id]
            );

            if (inscripcionCheck.rows.length > 0) {
              results.duplicates.push({
                fila: i + 2,
                rut,
                nombre,
                error: 'Alumno ya inscrito en el ramo',
              });
              continue;
            }
          } else {
            // Crear nuevo usuario
            const userResult = await client.query(
              'INSERT INTO users (rut, name, email, role) VALUES ($1, $2, $3, $4) RETURNING id',
              [rut, nombre, correo, 'alumno']
            );
            userId = userResult.rows[0].id;

            // Crear registro en tabla alumnos
            await client.query(
              'INSERT INTO alumnos (id_alumno) VALUES ($1)',
              [userId]
            );
          }

          // Agregar inscripción al ramo
          await client.query(
            'INSERT INTO inscripciones (id_alumno, id_ramo) VALUES ($1, $2)',
            [userId, id]
          );

          results.successful.push({
            rut,
            nombre,
            correo,
          });
        } catch (error) {
          results.failed.push({
            fila: i + 2,
            datos: row,
            error: error.message,
          });
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Importación completada',
      results,
      summary: {
        total: data.length,
        exitosos: results.successful.length,
        fallidos: results.failed.length,
        duplicados: results.duplicates.length,
      },
    });
  } catch (error) {
    console.error('Error importing students to ramo:', error);

    // Limpiar archivo temporal en caso de error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Error deleting temp file:', e);
      }
    }

    res.status(500).json({ error: 'Error al procesar el archivo: ' + error.message });
  }
};

module.exports = {
  listRamos,
  getRamoById,
  createRamo,
  addStudentToRamo,
  getRamoStudents,
  getRamoGroups,
  createRamoGroup,
  getRamoEvaluaciones,
  createRamoEvaluacion,
  importStudentsFromExcelToRamo
};
