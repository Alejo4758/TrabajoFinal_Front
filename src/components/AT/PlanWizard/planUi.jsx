// Piezas visuales que usa el formulario del plan de trabajo.
// Están en esta carpeta para que se pueda copiar a otro proyecto sin depender de nada más.
// Si el proyecto ya tiene su propio ActionButton, se puede reemplazar el de acá por el suyo
// (tiene que aceptar variant, onClick y disabled).

// "2026-10-28" -> "28 oct 2026" (se arma a mano para evitar desfases de zona horaria)
export function formatDate(iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '—';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('es-AR', options);
}

// Botón de acción real (el que reemplaza a SoonButton cuando una funcionalidad ya existe)
export function ActionButton({ children, variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      type={type}
      {...props}
      className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
        variant === 'primary' ? 'bg-primary text-white hover:bg-primary-hover' : 'border border-border text-text hover:bg-surface-alt'
      }`}
    >
      {children}
    </button>
  );
}

// Botón de selección tipo etiqueta (se activa y se desactiva)
export function PillToggle({ on, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        on ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text hover:border-primary/50'
      }`}
    >
      {on && <span aria-hidden="true">✓ </span>}
      {children}
    </button>
  );
}

export const controlClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export function Field({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-text-secondary">{label}</label>
      {children}
    </div>
  );
}
