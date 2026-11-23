import { useEffect, useId, useRef, useState } from "react";

// Chat con la IA para trabajar el borrador del informe: el AT pide cambios ("hacelo más breve", "agregá pautas para casa")
// o hace consultas, y cuando la IA modifica el informe el cambio se aplica directo en el editor (y se puede deshacer).
// Es un componente de presentación: la conversación y el pedido al backend los maneja la pestaña de informes.
//
// messages: [{ id, role: "user" | "assistant", content, warnings?, change?: { undone } , canUndo? }]
// onSend (text) devuelve una promesa con true si el mensaje se envió; si no, el texto vuelve al cuadro de escritura.
// Las respuestas de la IA son texto plano y se muestran como texto (React lo escapa): nunca como HTML

const MESSAGE_MAX = 2000;

// Sugerencias de un clic: para crear el informe (editor vacío) o para mejorar el que ya está
const CREATE_SUGGESTIONS = [
  "Redactá el informe completo del período",
  "Armalo breve, que entre en una página",
  "Destacá los logros y avances del período",
  "Incluí sugerencias concretas para el destinatario",
];

const EDIT_SUGGESTIONS = [
  "Hacelo más breve y concreto",
  "Usá un tono más formal",
  "Agregá pautas concretas y fáciles de aplicar",
  "Corregí la redacción y la ortografía",
];

function SendIcon () {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </svg>
  );
}

function TypingIndicator () {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.3s]"/>
      <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:-0.15s]"/>
      <span className="size-1.5 animate-bounce rounded-full bg-text-muted"/>
    </span>
  );
}

function Message ({ message, onUndo }) {
  if (message.role === "user") {
    return (
      <li className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm leading-relaxed text-white">
          <span className="sr-only">Vos: </span>{message.content}
        </p>
      </li>
    );
  }

  return (
    <li className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        <p className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-border bg-surface-alt px-3.5 py-2 text-sm leading-relaxed text-text">
          <span className="sr-only">IA: </span>{message.content}
        </p>

        {message.change && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
            {message.change.undone ? (
              <span className="text-text-muted">Cambio deshecho: el informe volvió a la versión anterior.</span>
            ) : (
              <>
                <span className="font-medium text-success">✓ Cambios aplicados en el informe</span>
                {message.canUndo && (
                  <button
                    type="button"
                    onClick={() => onUndo (message.id)}
                    className="cursor-pointer rounded font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    Deshacer
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {message.warnings?.length > 0 && (
          <ul className="space-y-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {message.warnings.map (warning => <li key={warning}>⚠️ {warning}</li>)}
          </ul>
        )}
      </div>
    </li>
  );
}

// hasDraft: el editor ya tiene contenido. Si no, lo que se escribe son instrucciones para que la IA redacte el informe
export default function ReportChat ({ hasDraft, messages, sending, error, disabledReason, onSend, onCancel, onUndo, onClear }) {
  const [input, setInput] = useState ("");
  const logRef = useRef (null);
  const inputRef = useRef (null);
  const ids = { title: useId (), input: useId (), hint: useId () };

  const disabled = Boolean (disabledReason);
  const canSend = !disabled && !sending && input.trim ().length > 0;

  // Siempre a la vista el último mensaje
  useEffect (() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages.length, sending]);

  const send = async text => {
    const value = text.trim ();
    if (!value || disabled || sending) return;
    setInput ("");
    const sent = await onSend (value);
    // Si no se pudo enviar, el texto vuelve al cuadro para reintentar (salvo que ya se haya empezado a escribir otro)
    if (!sent) setInput (current => current || value);
    inputRef.current?.focus ();
  };

  const handleSubmit = event => {
    event.preventDefault ();
    send (input);
  };

  // Enter envía; Shift+Enter hace un salto de línea
  const handleKeyDown = event => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault ();
      send (input);
    }
  };

  return (
    <section aria-labelledby={ids.title} className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h3 id={ids.title} className="text-base font-bold text-text">💬 Chat con la IA</h3>
          <p className="mt-0.5 text-sm text-text-muted">Pedile cambios al informe o hacele consultas</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            disabled={sending}
            className="shrink-0 cursor-pointer rounded-md px-2 py-1 text-xs font-semibold text-text-secondary transition hover:bg-surface-alt hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Nueva conversación
          </button>
        )}
      </div>

      <div ref={logRef} className="max-h-[50vh] min-h-48 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !sending ? (
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              {hasDraft
                ? "Contale a la IA qué querés mejorar: el tono, la extensión, una sección que falta o algo que no te convence. Los cambios se aplican directamente en el informe y los podés deshacer."
                : "Contale a la IA cómo querés el informe (qué destacar, qué tono usar, qué dejar afuera) y lo redacta con el plan de trabajo y los encuentros del período. Después le podés seguir pidiendo cambios."}
            </p>
            {!disabled && (
              <div className="flex flex-wrap gap-1.5">
                {(hasDraft ? EDIT_SUGGESTIONS : CREATE_SUGGESTIONS).map (suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send (suggestion)}
                    className="cursor-pointer rounded-full border border-primary/30 px-3 py-1 text-xs font-medium text-primary transition hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ul role="log" aria-live="polite" aria-label="Conversación con la IA" className="space-y-3">
            {messages.map (message => <Message key={message.id} message={message} onUndo={onUndo}/>)}
            {sending && (
              <li className="flex items-center gap-3 text-xs text-text-muted">
                <span className="rounded-2xl rounded-bl-md border border-border bg-surface-alt px-3.5 py-2.5"><TypingIndicator/></span>
                <span>La IA está trabajando en el informe…</span>
                <button
                  type="button"
                  onClick={onCancel}
                  className="cursor-pointer rounded font-semibold text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Cancelar
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {error && <p role="alert" className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="border-t border-border p-3">
        <label htmlFor={ids.input} className="sr-only">Mensaje para la IA</label>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id={ids.input}
            rows={2}
            maxLength={MESSAGE_MAX}
            value={input}
            disabled={disabled}
            onChange={event => setInput (event.target.value)}
            onKeyDown={handleKeyDown}
            aria-describedby={ids.hint}
            placeholder={disabled ? "" : hasDraft ? "Ej.: sacá la parte de diagnóstico y sumá sugerencias para el aula" : "Ej.: armá el informe destacando los avances en autonomía, con tono cálido"}
            className="max-h-40 min-h-11 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-surface-alt"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="Enviar mensaje"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl bg-primary text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon/>
          </button>
        </div>
        <p id={ids.hint} className="mt-1.5 text-xs text-text-muted">
          {disabledReason || "Enter para enviar · Shift+Enter para nueva línea. Los datos personales del paciente se ocultan antes de enviarse a la IA."}
        </p>
      </form>
    </section>
  );
}
