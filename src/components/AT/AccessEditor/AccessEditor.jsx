import { ACCESS_SECTIONS } from '../../../utils/networkModel';

// Casillas para elegir qué secciones del acompañamiento puede ver un integrante.
// Props: idPrefix, value (ids habilitados), onChange(ids), error
export default function AccessEditor({ idPrefix, value, onChange, error }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <fieldset aria-describedby={error ? `${idPrefix}-error` : undefined}>
      <legend className="text-sm font-semibold text-text">Qué podrá ver</legend>
      <p className="m-0 mt-1 text-sm text-text-muted">Es información sensible: habilitá solo lo necesario. Podrá hacer aportes únicamente sobre lo que veas habilitado.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {ACCESS_SECTIONS.map((section, index) => {
          const on = value.includes(section.id);
          return (
            <label key={section.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${on ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
              <input id={`${idPrefix}-${section.id}`} type="checkbox" checked={on} onChange={() => toggle(section.id)} className="mt-0.5 size-5 shrink-0 accent-primary" data-first={index === 0 ? 'true' : undefined} />
              <span>
                <span className="block text-sm font-medium text-text">{section.label}</span>
                <span className="block text-xs text-text-muted">{section.hint}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && <p id={`${idPrefix}-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}
