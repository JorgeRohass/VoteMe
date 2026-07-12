import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiUrl } from '../../utils/api';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rut = searchParams.get('id');
    const v = searchParams.get('v');

    if (!rut || !v) {
      setError('Faltan parámetros de autenticación.');
      return;
    }

    const verifyLogin = async () => {
      try {
        const response = await fetch(apiUrl('/auth/verify-sso'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: rut, v }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.needsRegistration) {
            // Usuario no existe, redirigir a registro con el rut
            navigate(`/register?rut=${encodeURIComponent(rut)}`);
          } else if (data.success) {
            // Usuario existe y fue logueado
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.role === 'profesor') {
              navigate('/profesor');
            } else {
              navigate('/sala-espera');
            }
          }
        } else {
          setError(data.error || 'Error al verificar sesión');
        }
      } catch (err) {
        setError('Error de conexión con el servidor');
      }
    };

    verifyLogin();
  }, [searchParams, navigate]);

  if (error) {
    return <div style={{ textAlign: 'center', marginTop: '2rem', color: 'red' }}>{error} <br/> <button onClick={() => navigate('/login')}>Volver a inicio</button></div>;
  }

  return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Verificando sesión...</div>;
};

export default AuthCallback;
