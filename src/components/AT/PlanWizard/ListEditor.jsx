import { useState } from 'react';
import { controlClass } from './planUi';

// Lista editable de textos: se pueden agregar, corregir y quitar elementos, y hay sugerencias para sumar con un clic.
// Props: id, label, hint, items (string[]), onChange(items), placeholder, suggestions, maxLength, error
export default function ListEditor({ id, label, hint, items, onChange, placeholder = 'Escribí y presioná Enter...', suggestions = [], maxLength = 300, error }) {
  const [draft, setDraft] = useState('');

  const exists = (text) => items.some((item) => item.trim().toLowerCase() === text.trim().toLowerCase());

  const add = (text) => {
    const clean = text.trim();
    if (!clean || exists(clean)) return;
    onChange([...items, clean]);
  };

  const submitDraft = () => {
    add(draft);
    setDraft('');
  };

  const update = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const available = suggestions.filter((s) => !exists(s));

  return (
    <div role="group" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="m-0 text-sm font-semibold">{label}</p>
      {hint && <p className="m-0 mt-1 text-sm text-text-muted">{hint}</p>}

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <textarea
                rows={2}
                value={item}
                maxLength={maxLength}
                onChange={(event) => update(index, event.target.value)}
                aria-label={`${label}, elemento ${index + 1}`}
                className={`${controlClass} resize-y`}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Quitar: ${item.slice(0, 50)}`}
                className="mt-0.5 shrink-0 cursor-pointer rounded-lg p-2.5 text-text-secondary transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          id={`${id}-new`}
          type="text"
          value={draft}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={`Agregar: ${label}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault(); // evita enviar el formulario
              submitDraft();
            }
          }}
          onBlur={submitDraft} // si el texto quedó escrito y no se agregó, no se pierde
          className={`${controlClass} ${error ? 'border-red-600' : ''}`}
        />
        <button
          type="button"
          onClick={submitDraft}
          className="shrink-0 cursor-pointer rounded-lg border border-border px-4 text-sm font-semibold transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Agregar
        </button>
      </div>

      {available.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-primary">Ver sugerencias ({available.length})</summary>
          <ul className="mt-2 flex flex-wrap gap-2">
            {available.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => add(suggestion)}
                  className="cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-left text-sm transition hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <span aria-hidden="true">+ </span>{suggestion}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
