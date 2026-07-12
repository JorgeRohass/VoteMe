const { pool } = require('../db');
const XLSX = require('xlsx');
const fs = require('fs');

/**
 * Importa estudiantes desde un archivo Excel
 * Esperado: columnas "nombre", "rut", "correo"
 */
const importStudentsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const { idGrupo } = req.body;
    
    if (!idGrupo) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El ID del grupo es obligatorio' });
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

    // Validar que exista el grupo
    const groupCheck = await pool.query('SELECT * FROM grupos WHERE id_grupo = $1', [idGrupo]);
    if (groupCheck.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Grupo no encontrado' });
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
            
            // Verificar si ya está en el grupo
            const groupCheck = await client.query(
              'SELECT * FROM alumno_grupo WHERE id_alumno = $1 AND id_grupo = $2',
              [userId, idGrupo]
            );

            if (groupCheck.rows.length > 0) {
              results.duplicates.push({
                fila: i + 2,
                rut,
                nombre,
                error: 'Alumno ya existe en el grupo',
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

          // Agregar alumno al grupo
          await client.query(
            'INSERT INTO alumno_grupo (id_alumno, id_grupo) VALUES ($1, $2)',
            [userId, idGrupo]
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
    console.error('Error importing students:', error);
    
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

/**
 * Obtiene los estudiantes de un grupo
 */
const getGroupStudents = async (req, res) => {
  try {
    const { idGrupo } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.rut, u.name as nombre, u.email as correo
       FROM users u
       INNER JOIN alumno_grupo ag ON u.id = ag.id_alumno
       WHERE ag.id_grupo = $1
       ORDER BY u.name`,
      [idGrupo]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error getting group students:', error);
    res.status(500).json({ error: 'No se pudieron obtener los estudiantes' });
  }
};

module.exports = {
  importStudentsFromExcel,
  getGroupStudents,
};
