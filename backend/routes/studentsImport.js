const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { importStudentsFromExcel, getGroupStudents } = require('../controllers/studentsImportController');

const router = Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'students-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos Excel (.xlsx, .xls)'), false);
    }
  },
});

// POST: Importar estudiantes desde Excel
router.post('/import', upload.single('file'), importStudentsFromExcel);

// GET: Obtener estudiantes de un grupo
router.get('/group/:idGrupo', getGroupStudents);

module.exports = router;
