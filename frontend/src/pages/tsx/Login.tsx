import '../css/Formulario.css';

const Login = () => {
  const handleLogin = () => {
    // El callback debe ser la ruta de auth/callback del frontend
    const callbackUrl = encodeURIComponent(`${window.location.origin}/auth/callback`);
    window.location.href = `https://huemul.utalca.cl/sso/login.php?url=${callbackUrl}`;
  };

  return (
    <div className="app-container">
      <div className="form-card">
        <div className="form-header">
          <h1>Bienvenido a VoteMe</h1>
          <p>Ingresa con tu cuenta Utalcapass para continuar.</p>
        </div>
        <button className="submit-button" onClick={handleLogin}>
          Iniciar sesión con Utalcapass
        </button>
      </div>
    </div>
  );
};

export default Login;
