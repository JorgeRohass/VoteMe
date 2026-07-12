import { useNavigate } from 'react-router-dom';
import '../css/Formulario.css';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="app-container">
      <div className="form-card">
        <div className="form-header">
          <h1>Bienvenido a VoteMe</h1>
          <p>Ya estás autenticado. Aquí puedes continuar con tus votaciones.</p>
        </div>
        <button className="submit-button" onClick={handleLogout}>
          Cerrar sesión 
        </button>
      </div>
    </div>
  );
};

export default Home;
