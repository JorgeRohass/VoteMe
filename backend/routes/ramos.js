const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { 
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
} = require('../controllers/ramosController');

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

const router = Router();

router.get('/:id', getRamoById);
router.get('/', listRamos);
router.post('/', createRamo);

// Nuevas rutas para estudiantes y grupos
router.post('/:id/students', addStudentToRamo);
router.get('/:id/students', getRamoStudents);
router.post('/:id/import-students', upload.single('file'), importStudentsFromExcelToRamo);
router.post('/:id/groups', createRamoGroup);
router.get('/:id/groups', getRamoGroups);

// Rutas para evaluaciones
router.get('/:id/evaluaciones', getRamoEvaluaciones);
router.post('/:id/evaluaciones', createRamoEvaluacion);

module.exports = router;
