
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Formulario from './pages/tsx/Formulario';
import Home from './pages/tsx/Home';
import Login from './pages/tsx/Login';
import AuthCallback from './pages/tsx/AuthCallback';
import RegisterSso from './pages/tsx/RegisterSso';
import './App.css';
import './styles/globals.css'
import { SalaEspera } from './pages/SalaEspera'
import { Votacion } from './pages/Votacion'
import { EvaluationDetail } from './pages/professor/EvaluationDetail'
import { GroupDetails } from './pages/professor/GroupDetails'
import { RamoDetails } from './pages/professor/RamoDetails'
import { GroupEvaluationView } from './pages/professor/GroupEvaluationView'
import { EvaluationForm } from './pages/student/EvaluationForm'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas - Sin autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/register" element={<RegisterSso />} />

        {/* Redirecciona a login como página inicial */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rutas protegidas - Requieren autenticación */}
        <Route path="/sala-espera" element={<ProtectedRoute><SalaEspera /></ProtectedRoute>} />
        <Route path="/votacion" element={<ProtectedRoute><Votacion /></ProtectedRoute>} />
        <Route path="/profesor" element={<ProtectedRoute><EvaluationDetail /></ProtectedRoute>} />
        <Route path="/profesor/ramo/:ramoId" element={<ProtectedRoute><RamoDetails /></ProtectedRoute>} />
        <Route path="/profesor/grupo/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
        <Route path="/profesor/evaluacion/:evaluacionId/grupo/:grupoId" element={<ProtectedRoute><GroupEvaluationView /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />

        {/* Ruta pública para evaluación con código */}
        <Route path="/evaluar/:codigo" element={<EvaluationForm />} />

        {/* Ruta por defecto - Redirige a login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App;
