const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const checkConnection = async () => {
  const client = await pool.connect();
  try {
    console.log('✅ Connected to Neon Database successfully.');
  } finally {
    client.release();
  }
};

const initDb = async () => {
  const client = await pool.connect();
  try {
    // 1. Tabla de Usuarios Base (SSO)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        rut VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        role VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(20);
    `);

    // 2. Tabla de Profesores (Admin) - Especialización de Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS profesores (
        id_profesor INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 3. Tabla de Alumnos - Especialización de Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS alumnos (
        id_alumno INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 4. Tabla de Ramos (Cursos)
    // Relación: 1 PROFESOR administra N RAMO
    await client.query(`
      CREATE TABLE IF NOT EXISTS ramos (
        id_ramo SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        creditos INT,
        id_profesor INT NOT NULL REFERENCES profesores(id_profesor) ON DELETE RESTRICT
      );
    `);

    // 5. Tabla de Inscripciones (Matrícula)
    // Relación: N INSCRIPCIÓN se asocian a 1 RAMO, 1 ALUMNO se inscribe en N INSCRIPCIÓN
    await client.query(`
      CREATE TABLE IF NOT EXISTS inscripciones (
        id_inscripcion SERIAL PRIMARY KEY,
        fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado VARCHAR(50) DEFAULT 'activo',
        id_alumno INT NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
        id_ramo INT NOT NULL REFERENCES ramos(id_ramo) ON DELETE CASCADE,
        CONSTRAINT unique_alumno_ramo UNIQUE (id_alumno, id_ramo)
      );
    `);

    // 6. Tabla de Evaluaciones
    // Relación: 1 RAMO tiene N EVALUACIÓN
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluaciones (
        id_evaluacion SERIAL PRIMARY KEY,
        titulo VARCHAR(100) NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('individual', 'grupal')),
        fecha_inicio TIMESTAMP NOT NULL,
        fecha_fin TIMESTAMP NOT NULL,
        id_ramo INT NOT NULL REFERENCES ramos(id_ramo) ON DELETE CASCADE
      );
    `);

    // 7. Tabla de Grupos
    // Relación: 1 RAMO tiene N GRUPOS. Opcionalmente se asocia a 1 EVALUACIÓN
    await client.query(`
      CREATE TABLE IF NOT EXISTS grupos (
        id_grupo SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        max_alumnos INT DEFAULT 0,
        id_evaluacion INT REFERENCES evaluaciones(id_evaluacion) ON DELETE SET NULL,
        id_ramo INT REFERENCES ramos(id_ramo) ON DELETE CASCADE
      );
    `);

    await client.query(`
      ALTER TABLE grupos
      ADD COLUMN IF NOT EXISTS id_ramo INT REFERENCES ramos(id_ramo) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS max_alumnos INT DEFAULT 0;
    `);

    // 8. Tabla Intermedia Alumno-Grupo (Relación Muchos a Muchos: PERTENECE)
    // Relación: M ALUMNOS pertenecen a N GRUPOS
    await client.query(`
      CREATE TABLE IF NOT EXISTS alumno_grupo (
        id_alumno INT REFERENCES alumnos(id_alumno) ON DELETE CASCADE,
        id_grupo INT REFERENCES grupos(id_grupo) ON DELETE CASCADE,
        PRIMARY KEY (id_alumno, id_grupo)
      );
    `);

    // 9. Tabla evaluacion_grupo
    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluacion_grupo (
        id_evaluacion_grupo SERIAL PRIMARY KEY,
        id_evaluacion INT NOT NULL REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE,
        id_grupo INT NOT NULL REFERENCES grupos(id_grupo) ON DELETE CASCADE,
        estado VARCHAR(20) DEFAULT 'pendiente',
        nota_final DECIMAL(5,2),
        UNIQUE(id_evaluacion, id_grupo)
      );
    `);

    // 10. Tabla criterios_evaluacion
    await client.query(`
      CREATE TABLE IF NOT EXISTS criterios_evaluacion (
        id_criterio SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        ponderacion DECIMAL(5,2) NOT NULL,
        tipo_escala VARCHAR(20) DEFAULT 'porcentaje',
        valor_maximo INT DEFAULT 100,
        subcriterios JSONB DEFAULT '[]'::jsonb,
        id_evaluacion INT NOT NULL REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE
      );
    `);

    await client.query(`
      ALTER TABLE criterios_evaluacion
      ADD COLUMN IF NOT EXISTS subcriterios JSONB DEFAULT '[]'::jsonb;
    `);

    // 11. Tabla de Códigos de Sesión
    await client.query(`
      CREATE TABLE IF NOT EXISTS sesiones (
        id_sesion SERIAL PRIMARY KEY,
        codigo VARCHAR(10) UNIQUE NOT NULL,
        estado VARCHAR(20) DEFAULT 'activo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        id_grupo INT NOT NULL REFERENCES grupos(id_grupo) ON DELETE CASCADE,
        id_evaluacion INT REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE
      );
    `);

    await client.query(`
      ALTER TABLE sesiones
      ADD COLUMN IF NOT EXISTS id_evaluacion INT REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
    `);

    // 12. Tabla respuestas_evaluacion
    await client.query(`
      CREATE TABLE IF NOT EXISTS respuestas_evaluacion (
        id_respuesta SERIAL PRIMARY KEY,
        id_sesion INT NOT NULL REFERENCES sesiones(id_sesion) ON DELETE CASCADE,
        id_criterio INT NOT NULL REFERENCES criterios_evaluacion(id_criterio) ON DELETE CASCADE,
        valor_asignado DECIMAL(5,2) NOT NULL,
        comentario TEXT,
        nombre_evaluador VARCHAR(100),
        rut_evaluador VARCHAR(20)
      );
    `);

    await client.query(`
      ALTER TABLE respuestas_evaluacion
      ADD COLUMN IF NOT EXISTS nombre_evaluador VARCHAR(100),
      ADD COLUMN IF NOT EXISTS rut_evaluador VARCHAR(20);
    `);

    // 13. Tabla de Votaciones (Mantenida por compatibilidad si se usa en otros flujos)
    // Relación: 1 ALUMNO realiza N VOTACIONES, 1 EVALUACIÓN recibe N VOTACIONES
    await client.query(`
      CREATE TABLE IF NOT EXISTS votaciones (
        id_votacion SERIAL PRIMARY KEY,
        valor INT NOT NULL, -- Nota o puntaje en un rango
        comentario TEXT,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        id_alumno INT NOT NULL REFERENCES alumnos(id_alumno) ON DELETE CASCADE, -- Quien realiza la votación
        id_evaluacion INT NOT NULL REFERENCES evaluaciones(id_evaluacion) ON DELETE CASCADE, -- Evaluación asociada
        id_alumno_evaluado INT REFERENCES alumnos(id_alumno) ON DELETE CASCADE, -- Estudiante evaluado (para evaluación individual o coevaluación)
        id_grupo_evaluado INT REFERENCES grupos(id_grupo) ON DELETE CASCADE -- Grupo evaluado (para evaluación grupal)
      );
    `);

    console.log('✅ Database initialized (all tables and relations checked/created).');
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  checkConnection,
  initDb
};
