# Archivo de Ejemplo para Importación de Estudiantes

## Formato Esperado

El archivo Excel debe contener las siguientes columnas (en la primera fila):

| nombre | rut | correo |
|--------|-----|--------|
| Juan García | 12345678-9 | juan.garcia@example.com |
| María López | 98765432-1 | maria.lopez@example.com |
| Carlos Rodríguez | 55555555-5 | carlos.rodriguez@example.com |

## Columnas Requeridas

- **nombre**: Nombre completo del estudiante
- **rut**: RUT del estudiante (con o sin guión)
- **correo**: Correo electrónico del estudiante

## Notas Importantes

1. Todas las columnas son obligatorias
2. El archivo puede estar en formato `.xlsx` o `.xls`
3. Los nombres de las columnas deben ser exactamente: `nombre`, `rut`, `correo` (sin acentos en los encabezados)
4. Si un estudiante ya existe en el grupo, no será duplicado
5. El sistema creará automáticamente los usuarios si no existen

## Cómo Crear el Archivo

1. Abre tu programa de hojas de cálculo (Excel, LibreOffice, Google Sheets)
2. Crea las columnas: nombre, rut, correo
3. Agrega cada estudiante en una fila
4. Guarda el archivo como `.xlsx`
5. Usa el formulario de importación en la página del grupo
