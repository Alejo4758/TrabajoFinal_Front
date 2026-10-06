import { Link } from 'react-router';

export default function Login () {
  const handleSubmit = e => {
    e.preventDefault ();
    // Enviar las credenciales al backend
    console.log('Login enviado');
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
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-text">
                Correo electrónico
              </label>
              <input id="email" name="email" type="email" autoComplete="email" required placeholder="ejemplo@correo.com" className="w-full rounded-md border border-border bg-surface px-4 py-3 text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-text">
                Contraseña
              </label>
              <input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Ingresá tu contraseña" className="w-full rounded-md border border-border bg-surface px-4 py-3 text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"/>
            </div>
            <button type="submit" className="w-full rounded-md bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
              Iniciar sesión
            </button>
          </form>
          <div className="mt-6 border-t border-border pt-6 text-center">
            <p className="m-0 text-sm text-text-secondary">
              ¿Todavía no tenés una cuenta?
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link to="/registerSol" className="text-sm font-medium text-secondary hover:underline">
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