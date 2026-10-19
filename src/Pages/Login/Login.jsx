import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { login } from '../../services/authService';
import { EMAIL_REGEX, ROLE_ROUTES, DEFAULT_ROUTE } from '../../utils/constants';
import FormField from '../../components/FormField/FormField';
import Icon from '../../components/Icon/Icon';

/* Logo: tres nodos conectados */
function BrandMark({ className = 'h-11 w-11' }) {
  return (
    <div className={`flex ${className} items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <path d="M12 6 6.5 17M12 6l5.5 11M6.5 17h11" opacity=".7" />
        <circle cx="12" cy="6" r="2.4" fill="currentColor" />
        <circle cx="6.5" cy="17" r="2.4" fill="currentColor" />
        <circle cx="17.5" cy="17" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function Login () {
  const navigate = useNavigate ();

  const [formData, setFormData] = useState ({ email: "", password: "" });
  const [error, setError] = useState (null);
  const [isLoading, setIsLoading] = useState (false);
  const [showPassword, setShowPassword] = useState (false);
  const [fieldErrors, setFieldErrors] = useState ({});
  const [touched, setTouched] = useState ({});

  const validate = ({ email, password }) => {
    const errors = {};
    const cleanEmail = email.trim ();
    if (!cleanEmail) errors.email = "El correo es obligatorio";
    else if (cleanEmail.length > 254) errors.email = "El correo es demasiado largo";
    else if (cleanEmail.includes ("..")) errors.email = "El correo no puede tener puntos consecutivos";
    else if (!EMAIL_REGEX.test (cleanEmail)) errors.email = "Ingresá un correo válido";
    if (!password) errors.password = "La contraseña es obligatoria";
    return errors;
  };

  const handleChange = event => {
    const { name, value } = event.target;
    setFormData ({ ...formData, [name]: value });
    setError (null);
    if (touched[name]) setFieldErrors (prevErrors => ({ ...prevErrors, [name]: validate ({ ...formData, [name]: value })[name] }));
  };

  const handleBlur = event => {
    const { name, value } = event.target;
    setTouched (prev => ({ ...prev, [name]: true }));
    setFieldErrors (prevErrors => ({ ...prevErrors, [name]: validate ({ ...formData, [name]: value })[name] }));
  };

  const handleSubmit = async event => {
    event.preventDefault ();
    const errors = validate (formData);
    setFieldErrors (errors);
    setTouched ({ email: true, password: true });
    const firstInvalid = Object.keys (errors)[0];
    if (firstInvalid) {
      document.getElementById (firstInvalid)?.focus ();
      return;
    }
    setIsLoading (true);
    setError (null);
    try {
      const responseData = await login ({ email: formData.email.trim (), password: formData.password }); 
      const destination = ROLE_ROUTES[responseData.user.role] ?? DEFAULT_ROUTE;
      localStorage.setItem ("token", responseData.token);
      localStorage.setItem ("user", JSON.stringify (responseData.user));
      navigate (destination, { replace: true });
    } catch (err) {
      setError (err.message);
    } finally {
      setIsLoading (false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-sans">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-xl font-extrabold tracking-tight text-text">RedAT</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary">
            <Icon name="arrow" className="h-4 w-4" /> Volver al inicio
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="m-0 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
                Bienvenido <span className="text-primary">de nuevo</span>
              </h2>
              <p className="m-0 mt-3 text-text-secondary">Ingresá a tu cuenta para continuar</p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {error && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}
                <div>
                  <FormField id="email" name="email" type="email" label="Correo electrónico" placeholder="ejemplo@correo.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={fieldErrors.email}
                    icon={<Icon name="mail"/>}
                  />
                </div>
                <div>
                  <FormField id="password" name="password" type={showPassword ? 'text' : 'password'} label="Contraseña" placeholder="Ingresá tu contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={fieldErrors.password}
                    icon={<Icon name="lock"/>}
                    rightSlot={
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30">
                        {showPassword ? 'Ocultar' : 'Mostrar'}
                      </button>
                    }
                  />
                </div>
                <button type="submit" disabled={isLoading}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-white shadow-lg shadow-primary/20 transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    isLoading ? 'cursor-not-allowed bg-primary/70' : 'bg-primary hover:-translate-y-0.5 hover:bg-primary-hover'
                  }`}
                >
                  {isLoading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3"/>
                      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  )}
                  {isLoading ? 'Conectando...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>
            <div className="mt-8 text-center">
              <p className="m-0 text-sm text-text-secondary">¿Todavía no tenés una cuenta?</p>
              <p className="m-0 mt-2 flex flex-col items-center justify-center gap-1 text-sm font-semibold sm:flex-row sm:gap-3">
                <Link to="/registerClient" className="text-secondary hover:underline">
                  Registrarme como solicitante
                </Link>
                <Link to="/registerAT" className="text-primary hover:underline">
                  Registrarme como AT
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}