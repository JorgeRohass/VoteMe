import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../../utils/api';
import '../css/Formulario.css';

function Formulario() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const rutFromQuery = searchParams.get('rut') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rutFromQuery) {
      navigate('/login');
    }
  }, [rutFromQuery, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(apiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: rutFromQuery, name, email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        navigate('/');
      } else {
        setError(data.error || 'Error al registrar usuario.');
      }
    } catch (err) {
      setLoading(false);
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="app-container">
      <div className="form-card">
        <div className="form-header">
          <h1>Registro de usuario</h1>
          <p>Completa tus datos para activar tu cuenta en VoteMe.</p>
        </div>

        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="rut">RUT</label>
            <input
              type="text"
              id="rut"
              className="form-input"
              value={rutFromQuery}
              readOnly
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Nombre completo</label>
            <input
              type="text"
              id="name"
              className="form-input"
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Formulario;
