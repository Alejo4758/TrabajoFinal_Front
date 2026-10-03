import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = ['Inicio', 'Pacientes', 'Agenda']

  return (
    <nav className="relative border-b border-slate-200 bg-white shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-sm font-bold text-white shadow-sm shadow-sky-200">
                R
              </div>
              <span className="text-lg font-semibold tracking-tight text-slate-800">RedAt</span>
            </a>

            <div className="flex lg:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-700 transition hover:bg-white"
                aria-label="toggle menu"
                aria-expanded={isOpen}
              >
                {isOpen ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div
            className={[
              'absolute inset-x-0 z-20 w-full bg-white px-6 py-4 transition-all duration-300 ease-in-out lg:static lg:w-auto lg:bg-transparent lg:p-0 lg:opacity-100 lg:translate-x-0 lg:flex lg:items-center',
              isOpen ? 'translate-x-0 opacity-100' : 'opacity-0 -translate-x-full lg:opacity-100',
            ].join(' ')}
          >
            <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
              {navItems.map((item) => (
                <Link to={`/${item.toLowerCase()}`}
                  key={item}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:mt-0"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-3 lg:mt-0 lg:ml-8">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="show notifications"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 17H20L18.5951 15.5951C18.2141 15.2141 18 14.6973 18 14.1585V11C18 8.38757 16.3304 6.16509 14 5.34142V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V5.34142C7.66962 6.16509 6 8.38757 6 11V14.1585C6 14.6973 5.78595 15.2141 5.40493 15.5951L4 17H9M15 17V18C15 19.6569 13.6569 21 12 21C10.3431 21 9 19.6569 9 18V17M15 17H9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <Link to="/signin" className="flex items-center gap-3 focus:outline-none" aria-label="Ir a iniciar sesión">
                <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100">
                  <img
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"
                    className="h-full w-full object-cover"
                    alt="avatar"
                  />
                </div>

                <div className="text-left lg:text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Usuario</p>
                  <h3 className="text-sm font-semibold text-slate-700">Khatab wedaa</h3>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}