import { Link } from 'react-router';

export default function Home() {
  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-10">
        <header className="mb-8 text-center">
          <h1 className="m-0 font-serif text-4xl font-bold text-text sm:text-5xl">
            RedAT
          </h1>
          <p className="m-0 mt-3 text-base leading-6 text-text-secondary sm:text-lg">
            Gestión y conexión para el acompañamiento terapéutico
          </p>
        </header>
        <section className="rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <div className="mx-auto max-w-xl">
            <div className="text-center">
              <h2 className="m-0 text-xl font-semibold text-text sm:text-2xl">
                Ingresa a tu cuenta
              </h2>
              <p className="m-0 mt-2 text-sm text-text-secondary">
                Accedé a tu espacio de trabajo para continuar.
              </p>
            </div>
            <Link to="/login" className="mt-5 flex w-full items-center justify-center rounded-md bg-text px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-text-secondary">
              Iniciar Sesión
            </Link>
          </div>
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 border-t border-border"/>
            <span className="m-0 whitespace-nowrap text-xs font-medium text-text-muted sm:text-sm">
              O registrate como nuevo usuario
            </span>
            <div className="flex-1 border-t border-border"/>
          </div>
          <div>
            <div className="text-center">
              <h2 className="m-0 text-xl font-semibold text-text sm:text-2xl">
                ¿Cómo vas a utilizar RedAT?
              </h2>
              <p className="m-0 mt-2 text-sm text-text-secondary">
                Seleccioná la opción que corresponda a tu necesidad.
              </p>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Link to="/registerSol" className="group flex min-h-55 flex-col items-center justify-center rounded-lg border-2 border-border p-6 text-center transition-all duration-300 hover:border-secondary hover:bg-surface-alt">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary-light text-secondary transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <h3 className="m-0 mt-4 text-lg font-semibold text-text">
                  Familiar / Paciente
                </h3>
                <p className="m-0 mt-2 max-w-xs text-sm leading-5 text-text-secondary">
                  Busco contratar un profesional para acompañamiento terapéutico.
                </p>
                <span className="mt-4 text-sm font-medium text-secondary">
                  Crear cuenta
                </span>
              </Link>
              <Link to="/registerAT" className="group flex min-h-55 flex-col items-center justify-center rounded-lg border-2 border-border p-6 text-center transition-all duration-300 hover:border-primary hover:bg-surface-alt">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-light text-primary transition-transform duration-300 group-hover:scale-110">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                  </svg>
                </div>
                <h3 className="m-0 mt-4 text-lg font-semibold text-text">
                  Profesional AT
                </h3>
                <p className="m-0 mt-2 max-w-xs text-sm leading-5 text-text-secondary">
                  Ofrecé tus servicios y gestioná tus acompañamientos desde RedAT.
                </p>
                <span className="mt-4 text-sm font-medium text-primary">
                  Crear cuenta
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}