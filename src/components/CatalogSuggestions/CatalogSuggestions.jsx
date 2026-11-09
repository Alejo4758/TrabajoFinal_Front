import { useEffect, useState } from "react";
import { getCatalogs, getCatalogSuggestions, reviewCatalogSuggestion } from "../../services/adminService";
import { matchesSearch } from "../../utils/catalogMatch";
import { formatDateList } from "../../utils/utils";
import Icon from "../Icon/Icon";

const TYPE_LABELS = { ESPECIALITY: "Especialidad", OBRA_SOCIAL: "Obra social" };

const FILTERS = [
  { status: "PENDING", label: "Pendientes" },
  { status: "APPROVED", label: "Aprobadas" },
  { status: "REJECTED", label: "Rechazadas" },
];

const FIELD = "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

// Mismos máximos que valida el backend
const NAME_MAX = 80;
const NOTE_MAX = 500;

// Cuántas opciones de la lista se muestran a la vez en el buscador
const SEARCH_LIMIT = 30;

const SECONDARY_BUTTON = "cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60";

// Buscador sobre la lista registrada, para elegir la opción que ya existe con otro nombre.
// options = [{ id, name, ats }]; las parecidas (similarIds) van primero
function ExistingOptionPicker ({ id, options, similarIds, value, onChange }) {
  const [search, setSearch] = useState ("");

  const ordered = [...options].sort ((a, b) => Number (similarIds.includes (b.id)) - Number (similarIds.includes (a.id)) || a.name.localeCompare (b.name, "es"));
  const matches = search.trim () ? ordered.filter (option => matchesSearch (option.name, search)) : ordered;
  const shown = matches.slice (0, SEARCH_LIMIT);

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor={`${id}-search`} className="mb-1.5 block text-sm font-medium text-text">Buscar en la lista ({options.length} registradas)</label>
        <input id={`${id}-search`} type="search" value={search} onChange={event => setSearch (event.target.value)} placeholder="Por ejemplo: federada" className={FIELD}/>
        <p className="mt-1 text-xs text-text-muted">No importan mayúsculas, tildes ni espacios: "federadasalud" encuentra "Federada Salud".</p>
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-text-secondary">No hay ninguna con ese nombre en la lista.</p>
      ) : (
        <fieldset>
          <legend className="sr-only">Elegí la opción que ya existe</legend>
          <ul className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-border p-2">
            {shown.map (option => (
              <li key={option.id}>
                <label className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${value === option.id ? "bg-primary/10" : "hover:bg-surface-alt"}`}>
                  <input type="radio" name={`${id}-option`} checked={value === option.id} onChange={() => onChange (option.id)} className="accent-primary"/>
                  <span className="flex-1 text-text">{option.name}</span>
                  {similarIds.includes (option.id) && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Parecida</span>}
                  <span className="text-xs text-text-muted">{option.ats} {option.ats === 1 ? "acompañante" : "acompañantes"}</span>
                </label>
              </li>
            ))}
          </ul>
          {matches.length > shown.length && <p className="mt-1 text-xs text-text-muted">Se muestran {shown.length} de {matches.length}: escribí para filtrar.</p>}
        </fieldset>
      )}
    </div>
  );
}

// Una sugerencia. Si está pendiente, se puede aprobar (corrigiendo el nombre si hace falta), indicar que ya estaba en la
// lista con otro nombre (se marca esa y el acompañante lo ve en su perfil) o rechazar (con el motivo).
// catalog = opciones registradas de su tipo ([{ id, name, ats }])
function SuggestionCard ({ suggestion, catalog, onReviewed }) {
  const [mode, setMode] = useState (null); // null | "approve" | "existing" | "reject"
  const [name, setName] = useState (suggestion.existing?.name ?? suggestion.name);
  const [note, setNote] = useState ("");
  const [existingId, setExistingId] = useState (null);
  const [busy, setBusy] = useState (false);
  const [error, setError] = useState ("");

  const at = suggestion.at ?? {};
  const pending = suggestion.status === "PENDING";
  const similar = suggestion.similar ?? [];
  const existingName = catalog.find (option => option.id === existingId)?.name;

  const openExisting = optionId => {
    setExistingId (optionId);
    setError ("");
    setMode ("existing");
  };

  const submit = async status => {
    setBusy (true);
    setError ("");
    const result = await reviewCatalogSuggestion (suggestion.id, { status, name, note, existingId: mode === "existing" ? existingId : null });
    setBusy (false);
    if (result.error) {
      setError (result.error);
      return;
    }
    onReviewed (result.data?.message ?? "Revisión registrada.");
  };

  const cancel = () => {
    setMode (null);
    setError ("");
  };

  return (
    <article className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{TYPE_LABELS[suggestion.type]}</span>
            {pending && suggestion.sameNameCount > 1 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">La pidieron {suggestion.sameNameCount} acompañantes</span>
            )}
          </div>
          <h3 className="mt-3 wrap-break-word text-lg font-bold text-text">{suggestion.name}</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Sugerida por {[at.name, at.lastName].filter (Boolean).join (" ") || "un acompañante"}
            {at.email && <span className="break-all"> ({at.email})</span>} · {formatDateList (suggestion.createdAt)}
          </p>
          {pending && suggestion.existing && (
            <p className="mt-2 text-sm text-text-secondary">
              Ya hay una opción con ese nombre en la lista (<span className="font-medium text-text">{suggestion.existing.name}</span>): al aprobarla se usa esa.
            </p>
          )}
          {pending && !suggestion.existing && similar.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Puede que ya esté en la lista con otro nombre:</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {similar.map (option => (
                  <li key={option.id}>
                    <button type="button" onClick={() => openExisting (option.id)} className="cursor-pointer rounded-full border border-amber-300 bg-surface px-3 py-1 text-sm text-text transition hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {option.name} · <span className="font-semibold">Es esta</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!pending && (
            <p className="mt-2 text-sm text-text-secondary">
              {suggestion.status === "APPROVED" ? "Aprobada" : "Rechazada"} el {formatDateList (suggestion.reviewedAt)}
              {suggestion.reviewNote && <>: <span className="text-text">{suggestion.reviewNote}</span></>}
            </p>
          )}
        </div>

        {pending && !mode && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={() => setMode ("reject")} className={SECONDARY_BUTTON}>
              Rechazar
            </button>
            <button type="button" onClick={() => openExisting (suggestion.existing?.id ?? similar[0]?.id ?? null)} className={SECONDARY_BUTTON}>
              Ya existe
            </button>
            <button type="button" onClick={() => setMode ("approve")} className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40">
              Aprobar
            </button>
          </div>
        )}
      </div>

      {mode === "approve" && (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <div>
            <label htmlFor={`suggestion-${suggestion.id}-name`} className="mb-1.5 block text-sm font-medium text-text">Nombre con el que se agrega a la lista</label>
            <input id={`suggestion-${suggestion.id}-name`} type="text" value={name} maxLength={NAME_MAX} onChange={event => setName (event.target.value)} className={FIELD}/>
            <p className="mt-1 text-xs text-text-muted">Podés corregir la ortografía. Queda marcada en el perfil de quien la sugirió.</p>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={cancel} disabled={busy} className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-alt disabled:opacity-60">Cancelar</button>
            <button type="button" onClick={() => submit ("APPROVED")} disabled={busy || !name.trim ()} className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Guardando..." : "Aprobar y agregar"}
            </button>
          </div>
        </div>
      )}

      {mode === "existing" && (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <p className="text-sm text-text-secondary">
            Elegí la opción que ya está en la lista. Se marca en el perfil de quien la sugirió y le avisamos que ya estaba con ese nombre. No se agrega nada nuevo.
          </p>
          <ExistingOptionPicker id={`suggestion-${suggestion.id}-existing`} options={catalog} similarIds={similar.map (option => option.id)} value={existingId} onChange={setExistingId}/>
          {existingName && (
            <p className="text-sm text-text">
              El acompañante va a ver: <span className="italic">Tu sugerencia "{suggestion.name}": Ya estaba en la lista como "{existingName}".</span>
            </p>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={cancel} disabled={busy} className={SECONDARY_BUTTON}>Cancelar</button>
            <button type="button" onClick={() => submit ("APPROVED")} disabled={busy || !existingId} className="cursor-pointer rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Guardando..." : "Marcar como existente"}
            </button>
          </div>
        </div>
      )}

      {mode === "reject" && (
        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <div>
            <label htmlFor={`suggestion-${suggestion.id}-note`} className="mb-1.5 block text-sm font-medium text-text">Motivo del rechazo</label>
            <textarea id={`suggestion-${suggestion.id}-note`} rows={3} value={note} maxLength={NOTE_MAX} onChange={event => setNote (event.target.value)} placeholder="Por ejemplo: ya está incluida en otra opción de la lista" className={`${FIELD} resize-y`}/>
            <p className="mt-1 text-xs text-text-muted">El acompañante lo va a ver en su perfil.</p>
          </div>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={cancel} disabled={busy} className="cursor-pointer rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-alt disabled:opacity-60">Cancelar</button>
            <button type="button" onClick={() => submit ("REJECTED")} disabled={busy || !note.trim ()} className="cursor-pointer rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? "Guardando..." : "Rechazar sugerencia"}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// Especialidades y obras sociales que sugirieron los acompañantes porque no estaban en la lista. onPendingCount informa
// cuántas quedan pendientes, para mostrarlo en la pestaña del panel
export default function CatalogSuggestions ({ onPendingCount }) {
  const [status, setStatus] = useState ("PENDING");
  const [state, setState] = useState ({ loading: true, error: "", items: [] });
  const [reloadKey, setReloadKey] = useState (0);
  const [message, setMessage] = useState ("");
  // Listas registradas ({ ESPECIALITY, OBRA_SOCIAL }), para buscar si lo que piden ya está con otro nombre
  const [catalogs, setCatalogs] = useState ({ ESPECIALITY: [], OBRA_SOCIAL: [] });

  // Se vuelven a pedir después de cada revisión: aprobar puede haber agregado una opción
  useEffect (() => {
    let cancelled = false;

    getCatalogs ().then (result => {
      if (!cancelled && result.data) setCatalogs (result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect (() => {
    let cancelled = false;

    getCatalogSuggestions (status).then (result => {
      if (cancelled) return;
      setState ({ loading: false, error: result.error ?? "", items: result.data });
      if (status === "PENDING" && !result.error) onPendingCount?.(result.data.length);
    });

    return () => {
      cancelled = true;
    };
  }, [status, reloadKey, onPendingCount]);

  const reload = () => {
    setState (previous => ({ ...previous, loading: true, error: "" }));
    setReloadKey (key => key + 1);
  };

  const changeStatus = next => {
    if (next === status) return;
    setMessage ("");
    setState ({ loading: true, error: "", items: [] });
    setStatus (next);
  };

  // Al revisar una se recarga la lista: las pendientes con el mismo nombre se resolvieron junto con ella
  const handleReviewed = text => {
    setMessage (text);
    reload ();
  };

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-text">Sugerencias de especialidades y obras sociales</h2>
        <p className="mt-1 text-sm text-text-secondary">Las propusieron los acompañantes porque no estaban en la lista. Si aprobás una, se suma a la lista para todos.</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar sugerencias">
        {FILTERS.map (filter => (
          <button key={filter.status} type="button" onClick={() => changeStatus (filter.status)} aria-pressed={status === filter.status}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${status === filter.status ? "border-primary bg-primary/10 text-primary" : "border-border text-text-secondary hover:text-text"}`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {message && (
        <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p>{message}</p>
          <button type="button" onClick={() => setMessage ("")} aria-label="Cerrar mensaje" className="cursor-pointer font-bold">×</button>
        </div>
      )}

      {state.error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{state.error}</p>
          <button type="button" onClick={reload} className="mt-3 cursor-pointer rounded-lg border border-red-200 px-3 py-2 font-semibold transition hover:bg-red-100">Reintentar</button>
        </div>
      )}

      {state.loading && state.items.length === 0 ? (
        <p className="text-sm text-text-secondary">Cargando sugerencias...</p>
      ) : !state.error && state.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" name="check"/>
          </div>
          <h3 className="mt-4 font-semibold text-text">{status === "PENDING" ? "No hay sugerencias pendientes" : "No hay sugerencias en esta lista"}</h3>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {state.items.map (suggestion => <SuggestionCard key={suggestion.id} suggestion={suggestion} catalog={catalogs[suggestion.type] ?? []} onReviewed={handleReviewed}/>)}
        </div>
      )}
    </section>
  );
}
