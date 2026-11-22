import { useEffect, useRef } from 'react';

// Ventana modal accesible. Si se pasa onSubmit, el contenido y el pie quedan dentro de un <form>.
// Props: title, titleId, onClose, busy (impide cerrar mientras se guarda), onSubmit, footer, size
export default function Modal({ title, titleId, onClose, busy = false, onSubmit, footer, size = 'max-w-lg', children }) {
  const dialogRef = useRef(null);

  // Escape cierra y la página de fondo no se desplaza mientras está abierto
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [busy, onClose]);

  // El foco entra al diálogo una sola vez, al abrirse
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const Body = onSubmit ? 'form' : 'div';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[94vh] w-full ${size} flex-col rounded-t-3xl bg-surface shadow-2xl focus:outline-none sm:rounded-3xl`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <h2 id={titleId} className="m-0 text-xl font-bold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
            className="cursor-pointer rounded-lg p-2 text-text-secondary transition hover:bg-background hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <Body onSubmit={onSubmit} noValidate={onSubmit ? true : undefined} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
          {footer && <footer className="flex flex-col-reverse gap-3 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5">{footer}</footer>}
        </Body>
      </div>
    </div>
  );
}
