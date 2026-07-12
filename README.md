# VoteMe

## Despliegue en Vercel

Este proyecto ya está preparado para desplegarse en Vercel con una base de datos externa.

### 1) Deploy del backend
- Crea un proyecto nuevo en Vercel y selecciona la carpeta [backend](backend).
- Define estas variables de entorno:
  - `DATABASE_URL`: conexión a tu base de datos PostgreSQL (Neon, Supabase, Railway, etc.)
  - `PORT`: `3000`
- Vercel usará [backend/api/index.js](backend/api/index.js) como función serverless y [backend/server.js](backend/server.js) como punto de entrada Express.

### 2) Deploy del frontend
- Crea otro proyecto en Vercel y selecciona la carpeta [frontend](frontend).
- Define la variable de entorno:
  - `VITE_API_URL`: la URL pública de tu backend, por ejemplo `https://tu-backend.vercel.app/api`
- Vercel construirá la app con `npm run build`.

### 3) Mantener la base de datos
- No uses la base de datos local del entorno de desarrollo.
- Conecta el backend a una base de datos persistente externa.
- Asegúrate de que `DATABASE_URL` apunte siempre a esa misma base de datos en producción.

### 4) Variables de ejemplo
- Backend: [backend/.env.example](backend/.env.example)
- Frontend: [frontend/.env.example](frontend/.env.example)

### 5) Verificación
- El build del frontend se validó correctamente con `npm run build`.
- El backend quedó preparado para Vercel mediante [backend/api/index.js](backend/api/index.js) y [backend/vercel.json](backend/vercel.json).
