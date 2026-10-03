import React from 'react'

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] lg:grid-cols-[1.05fr_1.2fr]">
        <div className="relative hidden min-h-[520px] bg-slate-900 lg:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1606660265514-358ebbadc80d?auto=format&fit=crop&w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sky-900/80 via-slate-900/60 to-slate-950/80" />

          <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold backdrop-blur-sm">
                R
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-sky-200">
                  RedAt
                </p>
                <p className="text-sm text-slate-200">Sistema terapéutico</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">
                Bienvenido
              </p>
              <h1 className="mt-4 max-w-xs text-3xl font-semibold tracking-tight text-white">
                Cuidamos cada paso del tratamiento.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-200">
                Gestioná pacientes, planes terapéuticos y actividades desde una sola plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white px-6 py-8 sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-lg font-bold text-white shadow-lg shadow-sky-200">
                R
              </div>
            </div>

            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                Acceso
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-800">
                Iniciar sesión
              </h2>
            </div>

            <button
              type="button"
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 40 40" aria-hidden="true">
                <path d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.045 27.2142 24.3525 30 20 30C14.4775 30 10 25.5225 10 20C10 14.4775 14.4775 9.99999 20 9.99999C22.5492 9.99999 24.8683 10.9617 26.6342 12.5325L31.3483 7.81833C28.3717 5.04416 24.39 3.33333 20 3.33333C10.7958 3.33333 3.33335 10.7958 3.33335 20C3.33335 29.2042 10.7958 36.6667 20 36.6667C29.2042 36.6667 36.6667 29.2042 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z" fill="#FFC107" />
                <path d="M5.25497 12.2425L10.7308 16.2583C12.2125 12.59 15.8008 9.99999 20 9.99999C22.5491 9.99999 24.8683 10.9617 26.6341 12.5325L31.3483 7.81833C28.3716 5.04416 24.39 3.33333 20 3.33333C13.5983 3.33333 8.04663 6.94749 5.25497 12.2425Z" fill="#FF3D00" />
                <path d="M20 36.6667C24.305 36.6667 28.2167 35.0192 31.1742 32.34L26.0159 27.975C24.3425 29.2425 22.2625 30 20 30C15.665 30 11.9842 27.2359 10.5975 23.3784L5.16254 27.5659C7.92087 32.9634 13.5225 36.6667 20 36.6667Z" fill="#4CAF50" />
                <path d="M36.3425 16.7358H35V16.6667H20V23.3333H29.4192C28.7592 25.1975 27.56 26.805 26.0133 27.9758C26.0142 27.975 26.015 27.975 26.0158 27.9742L31.1742 32.3392C30.8092 32.6708 36.6667 28.3333 36.6667 20C36.6667 18.8825 36.5517 17.7917 36.3425 16.7358Z" fill="#1976D2" />
              </svg>
              Continuar con Google
            </button>

            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                o
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Contraseña
                  </label>
                  <a href="#" className="text-xs font-medium text-sky-700 hover:text-sky-800">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
              >
                Ingresar
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              ¿No tenés una cuenta?{' '}
              <a href="#" className="font-semibold text-sky-700 hover:text-sky-800">
                Crear cuenta
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
