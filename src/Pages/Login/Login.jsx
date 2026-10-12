import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Asumiendo que usas react-router-dom para navegar
import { login } from '../../services/authService';

export default function Login () {
  const navigate = useNavigate();

  // 1. Estados para capturar los inputs y manejar errores/carga
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Limpiamos errores previos

    try {
      // 2. Llamamos a tu servicio pasándole el email y password
      const responseData = await login(formData);
      
      // Si llega hasta aquí, el login fue exitoso (status 200)
      console.log('Respuesta exitosa del backend:', responseData);

      // Guardamos el token en localStorage para mantener la sesión
      localStorage.setItem('token', responseData.token);
      localStorage.setItem('user', JSON.stringify(responseData.user));

      // Redirigimos al usuario (cambia '/dashboard' por tu ruta real)
      navigate('/dashboard'); 

    } catch (err) {
      // Si el backend tira error (ej: 401 Credenciales inválidas o 403 Falta confirmar email)
      console.error('Fallo el login:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 text-center">
          <h2 className="m-0 mt-4 text-2xl font-semibold text-text">
            Iniciar sesión
          </h2>
          <p className="m-0 mt-2 text-sm text-text-secondary">
            Accedé a tu cuenta para continuar
          </p>
        </div>
        <section className="rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 3. Bloque visual para mostrar el error del backend */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-text">
                Correo electrónico
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                autoComplete="email" 
                required 
                placeholder="ejemplo@correo.com" 
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-surface px-4 py-3 text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-text">
                Contraseña
              </label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                autoComplete="current-password" 
                required 
                placeholder="Ingresá tu contraseña" 
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-md border border-border bg-surface px-4 py-3 text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full rounded-md px-4 py-3 font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                isLoading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              {isLoading ? 'Conectando...' : 'Iniciar sesión'}
            </button>
          </form>
          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="m-0 text-sm text-text-secondary">
              ¿Todavía no tenés una cuenta?
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/registerClient" className="text-sm font-medium text-secondary hover:underline">
                Registrarme como solicitante
              </Link>
              <Link to="/registerAT" className="text-sm font-medium text-primary hover:underline">
                Registrarme como AT
              </Link>
            </div>
          </div>
        </section>
        <Link to="/" className="mt-6 text-center text-sm text-text-muted hover:text-text">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}