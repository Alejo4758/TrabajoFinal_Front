import { useId, useRef, useState } from "react";
import { CONTRIBUTION_MAX, authorRoleLabel, formatWhen, initials, validateContribution } from "../../../utils/boardModel";

const smallButton =
  "cursor-pointer rounded-md px-2 py-1 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50";

// Cuadro de texto con contador, compartido por "publicar" y "editar"
function ContributionEditor({ label, initialText = "", submitLabel, busyLabel, onSubmit, onCancel }) {
  const id = useId();
  const [text, setText] = useState(initialText);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const problem = validateContribution(text);
    if (problem) {
      setError(problem);
      document.getElementById(`${id}-text`)?.focus();
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(text.trim());
    } catch (err) {
      setError(err.message || "No pudimos guardar el aporte. Intentá nuevamente.");
      setBusy(false);
    }
  };

  const over = text.trim().length > CONTRIBUTION_MAX;

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <label htmlFor={`${id}-text`} className="block text-sm font-medium text-text">{label}</label>
      <textarea
        id={`${id}-text`}
        value={text}
        autoFocus
        rows={3}
        onChange={(event) => { setText(event.target.value); if (error) setError(""); }}
        onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); onCancel(); } }}
        aria-invalid={Boolean(error) || over}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ""}`}
        className={`w-full resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-text-muted focus:ring-2 ${
          error || over ? "border-red-400 focus:ring-red-200" : "border-border focus:border-primary focus:ring-primary/20"
        }`}
        placeholder="Contá lo que observaste, una duda o algo que el equipo debería saber"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-count`} className={`m-0 text-xs ${over ? "font-semibold text-red-600" : "text-text-muted"}`}>
          {text.trim().length}/{CONTRIBUTION_MAX} caracteres
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50">
            Cancelar
          </button>
          <button type="submit" disabled={busy} className="cursor-pointer rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-70">
            {busy ? busyLabel : submitLabel}
          </button>
        </div>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="m-0 text-sm text-red-600">{error}</p>}
    </form>
  );
}

// Un aporte. context = algo que se muestra arriba (por ejemplo, sobre qué registro es, en la pestaña Aportes)
export function ContributionItem({ item, contributions, context, highlight = false }) {
  const { viewer } = contributions;
  const [mode, setMode] = useState("view"); // view | edit | confirmDelete
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const actionsRef = useRef(null);

  const own = item.authorKey === viewer.key;
  // readOnly: la vista previa del AT. Muestra lo mismo que ve el integrante, pero sin acciones sobre sus aportes
  const canAct = !viewer.readOnly;
  const fromAT = item.authorRole === "AT";
  const hidden = Boolean(item.hiddenAt);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message || "No pudimos completar la acción.");
    } finally {
      setBusy(false);
    }
  };

  const backToView = () => {
    setMode("view");
    setTimeout(() => actionsRef.current?.querySelector("button")?.focus(), 0);
  };

  return (
    <li
      className={`flex gap-3 rounded-lg border p-3 sm:p-4 ${
        fromAT ? "border-primary/20 bg-primary/5" : "border-border bg-surface"
      } ${hidden ? "opacity-70" : ""} ${highlight ? "ring-2 ring-primary/30" : ""}`}
    >
      <div
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold ${fromAT ? "bg-primary text-white" : "bg-primary-light text-primary"}`}
      >
        {initials(item.authorName)}
      </div>

      <div className="min-w-0 flex-1">
        {context}
        <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
          <strong className="font-semibold text-text">{item.authorName}{own ? " (vos)" : ""}</strong>
          <span className="text-xs text-text-secondary">{authorRoleLabel(item)}</span>
          <span className="text-xs text-text-muted">
            · <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
            {item.editedAt && " · editado"}
          </span>
          {highlight && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">Nuevo</span>}
          {hidden && viewer.isAT && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Oculto para la red</span>}
        </p>

        {mode === "edit" ? (
          <div className="mt-2">
            <ContributionEditor
              label="Editar aporte"
              initialText={item.text}
              submitLabel="Guardar"
              busyLabel="Guardando..."
              onCancel={backToView}
              onSubmit={async (text) => {
                await contributions.edit(item.id, text);
                backToView();
              }}
            />
          </div>
        ) : (
          <p className="m-0 mt-1 whitespace-pre-line break-words text-sm leading-relaxed text-text-secondary">{item.text}</p>
        )}

        {hidden && own && !viewer.isAT && (
          <p className="m-0 mt-2 text-xs text-amber-800">El acompañante ocultó este aporte: el resto de la red no lo ve.</p>
        )}

        {mode === "view" && canAct && (own || viewer.isAT) && (
          <div ref={actionsRef} className="mt-2 flex flex-wrap gap-1">
            {own && (
              <>
                <button type="button" disabled={busy} onClick={() => setMode("edit")} className={`${smallButton} text-primary hover:bg-primary/10`}>
                  Editar<span className="sr-only"> tu aporte</span>
                </button>
                <button type="button" disabled={busy} onClick={() => setMode("confirmDelete")} className={`${smallButton} text-red-600 hover:bg-red-50`}>
                  Eliminar<span className="sr-only"> tu aporte</span>
                </button>
              </>
            )}
            {viewer.isAT && !own && (
              <button
                type="button"
                disabled={busy}
                aria-pressed={hidden}
                onClick={() => run(() => contributions.setHidden(item.id, !hidden))}
                className={`${smallButton} text-text-secondary hover:bg-surface-alt`}
              >
                {busy ? "Guardando..." : hidden ? "Volver a mostrar" : "Ocultar para la red"}
                <span className="sr-only"> el aporte de {item.authorName}</span>
              </button>
            )}
          </div>
        )}

        {mode === "confirmDelete" && (
          <div role="group" aria-label="Confirmar eliminación" className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
            <span className="text-xs text-red-700">¿Eliminar tu aporte? No se puede deshacer.</span>
            <button
              type="button"
              autoFocus
              disabled={busy}
              onClick={() => run(() => contributions.remove(item.id))}
              className={`${smallButton} bg-red-600 text-white hover:bg-red-700`}
            >
              {busy ? "Eliminando..." : "Sí, eliminar"}
            </button>
            <button type="button" disabled={busy} onClick={backToView} className={`${smallButton} text-text hover:bg-surface`}>
              Cancelar
            </button>
          </div>
        )}

        {error && <p role="alert" className="m-0 mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </li>
  );
}

// Botón "Agregar un aporte" que se convierte en el cuadro de texto
export function ContributionComposer({ target, contributions, label = "Agregar un aporte" }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const openerRef = useRef(null);

  const close = () => {
    setOpen(false);
    setTimeout(() => openerRef.current?.focus(), 0);
  };

  return (
    <div className="mt-3">
      {open ? (
        <ContributionEditor
          label={`Tu aporte sobre: ${target.label}`}
          submitLabel="Publicar"
          busyLabel="Publicando..."
          onCancel={close}
          onSubmit={async (text) => {
            await contributions.add(target, text);
            setStatus("Aporte publicado.");
            close();
          }}
        />
      ) : (
        <button
          ref={openerRef}
          type="button"
          onClick={() => { setStatus(""); setOpen(true); }}
          className="cursor-pointer rounded-lg border border-dashed border-primary/40 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          + {label}
        </button>
      )}
      <p role="status" className="sr-only">{status}</p>
    </div>
  );
}

// Hilo de aportes de un registro (el plan, un encuentro o un objetivo).
// collapsible: empieza cerrado y muestra solo el botón con la cantidad (útil en listas largas)
export default function Contributions({ contributions, target, canPost = true, collapsible = false, title = "Aportes de la red" }) {
  const id = useId();
  const [expanded, setExpanded] = useState(!collapsible);

  if (!contributions?.viewer) return null;

  const items = contributions.forTarget(target);
  const count = items.length;

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-lg border border-border bg-background p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={`${id}-title`} className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {title} <span className="font-normal normal-case tracking-normal text-text-muted">({count})</span>
        </h4>
        {collapsible && (
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={`${id}-panel`}
            onClick={() => setExpanded((value) => !value)}
            className="cursor-pointer text-xs font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {expanded ? "Ocultar aportes" : count > 0 ? `Ver aportes (${count})` : canPost ? "Comentar" : "Ver aportes"}
          </button>
        )}
      </div>

      <div id={`${id}-panel`} hidden={!expanded}>
        {contributions.loading ? (
          <p className="m-0 mt-2 text-sm text-text-muted">Cargando aportes...</p>
        ) : contributions.error ? (
          <p role="alert" className="m-0 mt-2 text-sm text-red-600">
            {contributions.error}{" "}
            <button type="button" onClick={() => contributions.reload()} className="cursor-pointer font-semibold underline">Reintentar</button>
          </p>
        ) : count === 0 ? (
          <p className="m-0 mt-2 text-sm text-text-muted">
            {canPost ? "Todavía no hay aportes sobre este registro. Podés ser quien deje el primero." : "Todavía no hay aportes sobre este registro."}
          </p>
        ) : (
          <ol className="m-0 mt-3 list-none space-y-2 p-0">
            {items.map((item) => <ContributionItem key={item.id} item={item} contributions={contributions} />)}
          </ol>
        )}
        {canPost && !contributions.loading && <ContributionComposer target={target} contributions={contributions} />}
      </div>
    </section>
  );
}
