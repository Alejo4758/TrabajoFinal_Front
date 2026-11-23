import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "../../../../hooks/useAuth";
import { generateReportDraft, getPatientReports, refineReportDraft, savePatientReport } from "../../../../services/reportService";
import { AUDIENCES, audienceInfo, buildFormalHeader, buildSignatureBlock, currentMonthRange, isHtmlEmpty, periodLabel, suggestedTitle } from "../../../../utils/reportModel";
import { newId } from "../../../../utils/planModel";
import { fullName } from "../../../../utils/utils";

import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import ActionButton from "../../../../components/AT/ActionButton/ActionButton";
import Field from "../../../../components/AT/Field/Field";
import Pill from "../../../../components/AT/Pill/Pill";
import ReportEditor from "../../../../components/AT/ReportEditor/ReportEditor";
import ReportChat from "../../../../components/AT/ReportEditor/ReportChat";
import { PrintableReport } from "../../../../components/AT/ReportEditor/PrintableReport";

const NOTES_MAX = 1000;
// Turnos anteriores del chat que se mandan con cada mensaje (el backend usa como mucho 20)
const CHAT_HISTORY_MAX = 20;

const ASIDE_TABS = [
  { id: "chat", label: "💬 Chat con IA" },
  { id: "saved", label: "Informes guardados" },
];

const INPUT_CLASS = "w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-red-400";

const formatTime = iso => new Date (iso).toLocaleTimeString ("es-AR", { hour: "2-digit", minute: "2-digit" });

const formatDateTime = iso => new Date (iso).toLocaleString ("es-AR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const emptyDocument = () => ({ id: null, title: "", titleTouched: false, html: "", savedAt: null });

// ---------- Piezas de la vista ----------

function Spinner () {
  return <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"/>;
}

function CheckIcon () {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12 5 5 9-10"/>
    </svg>
  );
}

// Diálogo con varias salidas (reemplazar / insertar / cancelar, descartar cambios). Atrapa el foco y lo devuelve al cerrar
function ChoiceDialog ({ title, text, actions, onCancel }) {
  const titleId = useId ();
  const textId = useId ();
  const dialogRef = useRef (null);
  const onCancelRef = useRef (onCancel);

  useEffect (() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect (() => {
    const previous = document.activeElement;
    dialogRef.current?.querySelector ("button")?.focus ();
    return () => previous?.focus?.();
  }, []);

  const handleKeyDown = event => {
    if (event.key === "Escape") {
      event.stopPropagation ();
      onCancelRef.current?.();
      return;
    }
    if (event.key !== "Tab") return;
    const buttons = [...dialogRef.current.querySelectorAll ("button:not([disabled])")];
    const first = buttons[0];
    const last = buttons.at (-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault ();
      last.focus ();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault ();
      first.focus ();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onMouseDown={event => event.target === event.currentTarget && onCancel ()}>
      <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={textId} onKeyDown={handleKeyDown} className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <h2 id={titleId} className="text-lg font-bold text-text">{title}</h2>
        <p id={textId} className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {actions.map (action => (
            <ActionButton key={action.label} variant={action.variant ?? "secondary"} onClick={action.onClick}>
              {action.label}
            </ActionButton>
          ))}
        </div>
      </div>
    </div>
  );
}

function AudiencePicker ({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold text-text-secondary">Destinatario del informe</legend>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AUDIENCES.map (audience => {
          const selected = audience.value === value;
          return (
            <label
              key={audience.value}
              className={`flex cursor-pointer flex-col rounded-xl border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-primary/30 ${
                selected ? "border-primary bg-primary-light/50" : "border-border bg-surface hover:border-border-strong hover:bg-surface-alt/60"
              }`}
            >
              <input type="radio" name="report-audience" value={audience.value} checked={selected} onChange={() => onChange (audience.value)} className="sr-only"/>
              <span className="flex items-start justify-between gap-2 text-sm font-semibold text-text">
                {audience.label}
                {selected && <CheckIcon/>}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-text-secondary">{audience.focus}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function StatusBadge ({ dirty, savedAt, isNew }) {
  if (dirty) return <Pill tone="warning">Borrador sin guardar</Pill>;
  if (savedAt) return <Pill tone="success">Guardado · {formatTime (savedAt)}</Pill>;
  return <Pill tone="neutral">{isNew ? "Nuevo informe" : "Sin cambios"}</Pill>;
}

function SavedReports ({ reports, loading, error, openId, onOpen, onDownload }) {
  return (
    <CardPatientDetail title="Informes guardados" subtitle={loading ? "Cargando…" : `${reports.length} ${reports.length === 1 ? "informe" : "informes"}`}>
      {loading && (
        <div className="animate-pulse space-y-3" aria-hidden="true">
          <div className="h-20 rounded-lg bg-surface-alt"/>
          <div className="h-20 rounded-lg bg-surface-alt"/>
        </div>
      )}

      {!loading && error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      {!loading && !error && reports.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-text-muted">
          Todavía no guardaste informes de este paciente. Cuando guardes uno, va a aparecer acá.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <ul className="space-y-3">
          {reports.map (report => {
            const audience = audienceInfo (report.audience);
            const open = report.id === openId;
            return (
              <li key={report.id} aria-current={open ? "true" : undefined} className={`rounded-lg border p-4 transition ${open ? "border-primary/50 bg-primary-light/30" : "border-border bg-background"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={audience.tone}>{audience.short}</Pill>
                  {open && <span className="text-xs font-medium text-primary">Abierto en el editor</span>}
                </div>
                <p className="mt-2 break-words font-semibold leading-snug text-text">{report.title}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Período: {periodLabel (report.from, report.to)}
                </p>
                <p className="text-xs text-text-muted">
                  Guardado el {formatDateTime (report.updatedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ActionButton variant="secondary" onClick={() => onOpen (report)} disabled={open} aria-label={`Abrir o editar ${report.title}`}>
                    Abrir / Editar
                  </ActionButton>
                  <ActionButton variant="secondary" onClick={() => onDownload (report)} aria-label={`Descargar en PDF ${report.title}`}>
                    Descargar PDF
                  </ActionButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </CardPatientDetail>
  );
}

// ---------- Pestaña ----------

export default function Reports ({ patient }) {
  const { token, user } = useAuth ();
  const authorName = fullName (user) || "Acompañante terapéutico";

  // Destinatario y período: los usa el asistente para generar y quedan guardados con el informe
  const [settings, setSettings] = useState (() => ({ audience: AUDIENCES[0].value, ...currentMonthRange () }));
  const [extraNotes, setExtraNotes] = useState ("");
  const [assistantOpen, setAssistantOpen] = useState (true);

  const [doc, setDoc] = useState (emptyDocument);
  const [dirty, setDirty] = useState (false);

  const [reports, setReports] = useState ([]);
  const [loadingReports, setLoadingReports] = useState (true);
  const [reportsError, setReportsError] = useState ("");

  const [generating, setGenerating] = useState (false);
  const [generateError, setGenerateError] = useState ("");
  const [saving, setSaving] = useState (false);
  const [saveError, setSaveError] = useState ("");
  const [notice, setNotice] = useState (null);
  const [dialog, setDialog] = useState (null);
  // Informe del historial que se está por imprimir (si es null se imprime el que está en el editor)
  const [printTarget, setPrintTarget] = useState (null);

  // Chat con la IA sobre el informe del editor. La conversación vive acá (el backend no la guarda) y se reinicia
  // al empezar un informe nuevo o abrir otro. Los mensajes de la IA que cambiaron el informe guardan la versión
  // anterior (change.before) para poder deshacerlos
  const [chat, setChat] = useState ([]);
  const [chatSending, setChatSending] = useState (false);
  const [chatError, setChatError] = useState ("");
  const [asideTab, setAsideTab] = useState ("chat");

  const abortRef = useRef (null);
  const chatAbortRef = useRef (null);
  const studioRef = useRef (null);
  const titleInputRef = useRef (null);

  const ids = { from: useId (), to: useId (), notes: useId (), title: useId (), editor: useId (), assistant: useId () };

  // El título sugerido sigue al destinatario y al período hasta que el AT lo escribe a mano
  const title = doc.titleTouched ? doc.title : suggestedTitle (settings.audience, settings.from, settings.to);
  const hasContent = !isHtmlEmpty (doc.html);
  const rangeError = settings.from && settings.to && settings.from > settings.to ? "«Desde» no puede ser posterior a «Hasta»." : "";

  const sessionsInRange = useMemo (
    () => (patient.sessions ?? []).filter (session => session.date >= settings.from && session.date <= settings.to).length,
    [patient.sessions, settings.from, settings.to],
  );

  const hasPlan = (patient.plan?.stages ?? []).some (stage => (stage.specificGoals ?? []).length > 0) || Boolean (patient.plan?.specificGoals?.length);

  // ---------- Carga del historial ----------

  useEffect (() => {
    const controller = new AbortController ();

    (async () => {
      const { data, error } = await getPatientReports (patient.id, { token, signal: controller.signal });
      if (controller.signal.aborted) return;
      setReports (data ?? []);
      setReportsError (error ?? "");
      setLoadingReports (false);
    }) ();

    return () => controller.abort ();
  }, [patient.id, token]);

  // Cancela una generación o un mensaje del chat en curso si se sale de la pestaña
  useEffect (() => () => {
    abortRef.current?.abort ();
    chatAbortRef.current?.abort ();
  }, []);

  // Aviso del navegador al cerrar o recargar con cambios sin guardar
  useEffect (() => {
    if (!dirty) return undefined;
    const handler = event => {
      event.preventDefault ();
      event.returnValue = "";
    };
    window.addEventListener ("beforeunload", handler);
    return () => window.removeEventListener ("beforeunload", handler);
  }, [dirty]);

  // Impresión de un informe del historial: se dibuja en la copia de impresión y recién entonces se abre el cuadro
  useEffect (() => {
    if (!printTarget) return undefined;
    const clear = () => setPrintTarget (null);
    window.addEventListener ("afterprint", clear, { once: true });
    const frame = requestAnimationFrame (() => window.print ());
    return () => {
      cancelAnimationFrame (frame);
      window.removeEventListener ("afterprint", clear);
    };
  }, [printTarget]);

  // ---------- Edición ----------

  const updateSettings = changes => {
    setSettings (previous => ({ ...previous, ...changes }));
    if (doc.id || hasContent) setDirty (true);
  };

  const handleHtmlChange = html => {
    setDoc (previous => ({ ...previous, html }));
    setDirty (true);
    setSaveError ("");
  };

  const handleTitleChange = event => {
    setDoc (previous => ({ ...previous, title: event.target.value, titleTouched: true }));
    setDirty (true);
    setSaveError ("");
  };

  const scrollToStudio = () => window.requestAnimationFrame (() => studioRef.current?.scrollIntoView ({ behavior: "smooth", block: "start" }));

  // Si hay cambios sin guardar, pregunta antes de reemplazar el documento del editor
  const confirmDiscard = (action, text) => {
    if (!dirty) {
      action ();
      return;
    }
    setDialog ({
      title: "Hay cambios sin guardar",
      text,
      actions: [
        { label: "Cancelar", onClick: () => setDialog (null) },
        { label: "Descartar cambios", variant: "primary", onClick: () => { setDialog (null); action (); } },
      ],
    });
  };

  const resetChat = () => {
    chatAbortRef.current?.abort ();
    setChat ([]);
    setChatSending (false);
    setChatError ("");
  };

  const resetDocument = () => {
    setDoc (emptyDocument ());
    setDirty (false);
    setSaveError ("");
    setNotice (null);
    resetChat ();
    titleInputRef.current?.focus ();
  };

  const handleNew = () => confirmDiscard (resetDocument, "Si empezás un informe nuevo se pierden las ediciones que no guardaste.");

  const openReport = report => {
    setDoc ({ id: report.id, title: report.title, titleTouched: true, html: report.html, savedAt: report.updatedAt });
    setSettings ({ audience: report.audience, from: report.from, to: report.to });
    setDirty (false);
    setSaveError ("");
    resetChat ();
    setNotice ({ tone: "info", text: `Abriste «${report.title}». Los cambios se guardan sobre este mismo informe.` });
    scrollToStudio ();
  };

  const handleOpen = report => confirmDiscard (() => openReport (report), "Si abrís otro informe se pierden las ediciones que no guardaste del actual.");

  // ---------- Asistente ----------

  const applyDraft = (draft, mode) => {
    setDoc (previous => ({ ...previous, html: mode === "append" && !isHtmlEmpty (previous.html) ? `${previous.html}<hr>${draft.html}` : draft.html }));
    setDirty (true);
    setDialog (null);
    const { sessions, goalsWorked } = draft.stats;
    const warnings = draft.warnings?.length ? ` Atención: ${draft.warnings.join (" ")}` : "";
    setNotice ({
      tone: "info",
      text: (sessions
        ? `Borrador generado a partir de ${sessions === 1 ? "1 encuentro" : `${sessions} encuentros`} y ${goalsWorked === 1 ? "1 objetivo trabajado" : `${goalsWorked} objetivos trabajados`}. Revisalo y completá las partes marcadas con [Completar]. Si querés cambiar algo, pedíselo a la IA en el chat.`
        : "No hay encuentros registrados en el período: el borrador tiene la estructura para completarlo a mano.") + warnings,
    });
    setAsideTab ("chat");
    scrollToStudio ();
  };

  const handleGenerate = async () => {
    if (rangeError) {
      setGenerateError (rangeError);
      return;
    }

    abortRef.current?.abort ();
    const controller = new AbortController ();
    abortRef.current = controller;

    setGenerating (true);
    setGenerateError ("");
    setNotice (null);

    const { data, error } = await generateReportDraft ({ patient, ...settings, extraNotes }, { signal: controller.signal, token });

    if (controller.signal.aborted) return;
    setGenerating (false);

    if (error) {
      setGenerateError (error);
      return;
    }
    if (!data) return;

    if (!hasContent) {
      applyDraft (data, "replace");
      return;
    }

    setDialog ({
      title: "El informe ya tiene contenido",
      text: "¿Querés reemplazar lo que escribiste por el borrador nuevo o agregarlo al final del documento?",
      actions: [
        { label: "Cancelar", onClick: () => setDialog (null) },
        { label: "Insertar al final", onClick: () => applyDraft (data, "append") },
        { label: "Reemplazar contenido", variant: "primary", onClick: () => applyDraft (data, "replace") },
      ],
    });
  };

  // ---------- Chat con la IA ----------

  // Envía un mensaje con el informe tal como está en el editor. El editor queda bloqueado mientras la IA trabaja, así
  // la respuesta no pisa ediciones hechas mientras tanto. Devuelve true si se envió (si no, el chat devuelve el texto al cuadro)
  const handleChatSend = async text => {
    chatAbortRef.current?.abort ();
    const controller = new AbortController ();
    chatAbortRef.current = controller;

    const history = chat.slice (-CHAT_HISTORY_MAX).map (({ role, content }) => ({ role, content }));
    const htmlBefore = doc.html;
    const userMessage = { id: newId (), role: "user", content: text };

    setChat (previous => [...previous, userMessage]);
    setChatSending (true);
    setChatError ("");

    // Con el editor vacío se manda "" (el editor deja "<p></p>"): la IA redacta el informe desde cero
    const { data, error } = await refineReportDraft (
      { patientId: patient.id, ...settings, extraNotes, currentHtml: hasContent ? htmlBefore : "", instruction: text, messages: history },
      { signal: controller.signal, token },
    );

    const removeUserMessage = () => setChat (previous => previous.filter (message => message.id !== userMessage.id));

    if (controller.signal.aborted) {
      removeUserMessage ();
      return false;
    }
    setChatSending (false);

    if (error || !data) {
      removeUserMessage ();
      setChatError (error || "La IA no pudo responder. Intentá nuevamente.");
      return false;
    }

    const changed = data.changed && data.html;
    setChat (previous => [...previous, {
      id: newId (),
      role: "assistant",
      content: data.reply,
      warnings: data.warnings,
      change: changed ? { before: htmlBefore, after: data.html, undone: false } : null,
    }]);

    if (changed) {
      setDoc (previous => ({ ...previous, html: data.html }));
      setDirty (true);
      setSaveError ("");
    }
    return true;
  };

  const handleChatCancel = () => {
    chatAbortRef.current?.abort ();
    setChatSending (false);
  };

  const handleChatUndo = messageId => {
    const message = chat.find (item => item.id === messageId);
    if (!message?.change) return;
    setDoc (previous => ({ ...previous, html: message.change.before }));
    setDirty (true);
    setChat (previous => previous.map (item => (item.id === messageId ? { ...item, change: { ...item.change, undone: true } } : item)));
  };

  // Solo se puede deshacer el último cambio de la IA, y mientras el informe siga como lo dejó
  // (si después se editó a mano, se usa el Deshacer del editor)
  const lastChange = chat.findLast (message => message.change && !message.change.undone);
  const chatMessages = chat.map (message => (message === lastChange ? { ...message, canUndo: doc.html === message.change.after } : message));

  // Con el editor vacío también se puede chatear: la IA redacta el informe siguiendo las instrucciones
  const chatDisabledReason = rangeError || (generating ? "Esperá a que termine de generarse el borrador." : "");

  const handleTabKeyDown = event => {
    if (!["ArrowLeft", "ArrowRight"].includes (event.key)) return;
    event.preventDefault ();
    const next = ASIDE_TABS[(ASIDE_TABS.findIndex (tab => tab.id === asideTab) + (event.key === "ArrowRight" ? 1 : ASIDE_TABS.length - 1)) % ASIDE_TABS.length];
    setAsideTab (next.id);
    document.getElementById (`${ids.assistant}-tab-${next.id}`)?.focus ();
  };

  // ---------- Guardar y exportar ----------

  const handleSave = async () => {
    if (!title.trim ()) {
      setSaveError ("Poné un título al informe antes de guardarlo.");
      titleInputRef.current?.focus ();
      return;
    }
    if (!hasContent) {
      setSaveError ("El informe está vacío: escribí el contenido o generá un borrador.");
      return;
    }

    setSaving (true);
    setSaveError ("");

    const { data, error } = await savePatientReport (patient.id, { id: doc.id, title, ...settings, html: doc.html }, { token });

    setSaving (false);

    if (error) {
      setSaveError (error);
      return;
    }

    setDoc (previous => ({ ...previous, id: data.id, title: data.title, titleTouched: true, savedAt: data.updatedAt }));
    setDirty (false);
    setReports (previous => [data, ...previous.filter (report => report.id !== data.id)]);
    setNotice ({ tone: "success", text: `«${data.title}» quedó guardado en el historial del paciente.` });
  };

  const handleExport = () => {
    if (!hasContent) {
      setSaveError ("El informe está vacío: no hay nada para exportar.");
      return;
    }
    window.print ();
  };

  const currentReport = { title: title || "Informe", audience: settings.audience, from: settings.from, to: settings.to, html: doc.html };
  const printReport = printTarget ?? (hasContent ? currentReport : null);

  const snippets = [
    {
      id: "header",
      label: "Encabezado formal",
      title: "Inserta al inicio los datos del paciente que corresponden al destinatario",
      position: "start",
      getHtml: () => buildFormalHeader (patient, settings.audience, settings),
    },
    {
      id: "signature",
      label: "Bloque de firma",
      title: "Inserta al final el cierre con espacio para firma y matrícula",
      position: "end",
      getHtml: () => buildSignatureBlock (authorName),
    },
  ];

  const audience = audienceInfo (settings.audience);

  return (
    <div className="space-y-6">
      {notice && (
        <div role="status" className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${notice.tone === "success" ? "border-success/30 bg-success/5 text-text" : "border-primary/20 bg-primary/5 text-text"}`}>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice (null)} aria-label="Cerrar aviso" className="cursor-pointer rounded px-1 text-text-muted hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            ✕
          </button>
        </div>
      )}

      {/* ---------- Asistente de redacción ---------- */}
      <section aria-labelledby={`${ids.assistant}-title`} className="overflow-hidden rounded-xl border border-border bg-surface">
        <h3 id={`${ids.assistant}-title`} className="m-0">
          <button
            type="button"
            aria-expanded={assistantOpen}
            aria-controls={ids.assistant}
            onClick={() => setAssistantOpen (open => !open)}
            className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-alt/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:px-6"
          >
            <span>
              <span className="block text-base font-bold text-text">✨ Asistente de redacción con IA</span>
              <span className="mt-0.5 block text-sm font-normal text-text-muted">Arma un borrador con el plan de trabajo y los encuentros del período, adaptado a quién lo va a leer</span>
            </span>
            <svg viewBox="0 0 24 24" className={`size-5 shrink-0 text-text-muted transition-transform ${assistantOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </h3>

        {assistantOpen && (
          <div id={ids.assistant} className="space-y-5 border-t border-border px-5 py-5 sm:px-6">
            <AudiencePicker value={settings.audience} onChange={value => updateSettings ({ audience: value })}/>

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="grid grid-cols-2 gap-4 lg:col-span-5">
                <Field id={ids.from} label="Desde">
                  <input id={ids.from} type="date" required value={settings.from} max={settings.to || undefined} aria-invalid={Boolean (rangeError)} onChange={event => updateSettings ({ from: event.target.value })} className={INPUT_CLASS}/>
                </Field>
                <Field id={ids.to} label="Hasta">
                  <input id={ids.to} type="date" required value={settings.to} min={settings.from || undefined} aria-invalid={Boolean (rangeError)} onChange={event => updateSettings ({ to: event.target.value })} className={INPUT_CLASS}/>
                </Field>
                <p className="col-span-2 -mt-1 text-xs text-text-muted" aria-live="polite">
                  {rangeError || (
                    <>
                      {sessionsInRange === 1 ? "1 encuentro registrado" : `${sessionsInRange} encuentros registrados`} en el período.
                      {!hasPlan && (
                        <> El paciente no tiene plan de trabajo con objetivos: <Link to="?tab=workPlan" replace className="font-medium text-primary hover:underline">armalo</Link> para que el borrador los incluya.</>
                      )}
                    </>
                  )}
                </p>
              </div>
              <div className="lg:col-span-7">
                <Field id={ids.notes} label="Valoración profesional o situaciones particulares a incluir (opcional)">
                  <textarea
                    id={ids.notes}
                    rows={3}
                    maxLength={NOTES_MAX}
                    value={extraNotes}
                    onChange={event => setExtraNotes (event.target.value)}
                    aria-describedby={`${ids.notes}-hint`}
                    placeholder="Ej.: en las últimas semanas se observó mayor tolerancia a los cambios de rutina; la familia comenta…"
                    className={`${INPUT_CLASS} resize-y`}
                  />
                </Field>
                <p id={`${ids.notes}-hint`} className="mt-1 text-right text-xs text-text-muted">{extraNotes.length}/{NOTES_MAX}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary" aria-live="polite">
                {generating ? "Analizando plan de trabajo y encuentros del período..." : `Enfoque: ${audience.focus}`}
              </p>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || chatSending || Boolean (rangeError)}
                aria-busy={generating}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating ? <><Spinner/> Generando borrador…</> : "✨ Generar borrador con IA"}
              </button>
            </div>

            {generateError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{generateError}</p>}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ---------- Estudio de edición ---------- */}
        <section ref={studioRef} aria-label="Edición del informe" className="min-w-0 scroll-mt-24 space-y-4 rounded-xl border border-border bg-surface p-5 sm:p-6 lg:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Field id={ids.title} label="Título del informe">
                <input ref={titleInputRef} id={ids.title} type="text" value={title} maxLength={160} onChange={handleTitleChange} placeholder="Informe de Evolución - Noviembre 2026 (Obra Social)" className={`${INPUT_CLASS} font-semibold`}/>
              </Field>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:pb-2" aria-live="polite">
              <StatusBadge dirty={dirty} savedAt={doc.savedAt} isNew={!doc.id && !hasContent}/>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span>Para: <span className="font-medium text-text-secondary">{audience.label}</span></span>
            <span aria-hidden="true">·</span>
            <span>Período: <span className="font-medium text-text-secondary">{settings.from && settings.to ? periodLabel (settings.from, settings.to) : "sin definir"}</span></span>
          </div>

          {hasContent && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              <span aria-hidden="true">⚠️</span>
              Revisá y completá la valoración profesional antes de guardar o exportar. El borrador es una ayuda: la responsabilidad del contenido es del acompañante.
            </p>
          )}

          <ReportEditor id={ids.editor} value={doc.html} onChange={handleHtmlChange} snippets={snippets} label={`Contenido de ${title || "el informe"}`} readOnly={chatSending}/>
          {chatSending && <p className="-mt-2 text-xs text-text-muted" aria-live="polite">La IA está editando el informe: el editor se desbloquea cuando termine.</p>}

          {saveError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{saveError}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <ActionButton variant="secondary" onClick={handleNew}>
              Limpiar / Nuevo informe
            </ActionButton>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ActionButton variant="secondary" onClick={handleExport} disabled={!hasContent}>
                Exportar PDF
              </ActionButton>
              <ActionButton onClick={handleSave} disabled={saving || !hasContent} aria-busy={saving}>
                {saving ? "Guardando…" : doc.id ? "Guardar cambios" : "Guardar informe"}
              </ActionButton>
            </div>
          </div>
          <p className="text-xs text-text-muted">
            Al exportar se abre el cuadro de impresión: elegí "Guardar como PDF" como destino.
          </p>
        </section>

        {/* ---------- Chat con la IA e historial ---------- */}
        <aside className="min-w-0 lg:col-span-4">
          <div className="space-y-3 lg:sticky lg:top-[calc(var(--spacing-navbar)+1.5rem)]">
            <div role="tablist" aria-label="Panel lateral del informe" onKeyDown={handleTabKeyDown} className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
              {ASIDE_TABS.map (tab => {
                const selected = tab.id === asideTab;
                return (
                  <button
                    key={tab.id}
                    id={`${ids.assistant}-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`${ids.assistant}-panel`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setAsideTab (tab.id)}
                    className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                      selected ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface-alt hover:text-text"
                    }`}
                  >
                    {tab.label}
                    {tab.id === "saved" && !loadingReports && <span className="ml-1 font-normal text-text-muted">({reports.length})</span>}
                    {tab.id === "chat" && chatSending && <span className="sr-only"> (la IA está respondiendo)</span>}
                  </button>
                );
              })}
            </div>

            <div id={`${ids.assistant}-panel`} role="tabpanel" aria-labelledby={`${ids.assistant}-tab-${asideTab}`}>
              {asideTab === "chat" ? (
                <ReportChat
                  hasDraft={hasContent}
                  messages={chatMessages}
                  sending={chatSending}
                  error={chatError}
                  disabledReason={chatDisabledReason}
                  onSend={handleChatSend}
                  onCancel={handleChatCancel}
                  onUndo={handleChatUndo}
                  onClear={resetChat}
                />
              ) : (
                <SavedReports reports={reports} loading={loadingReports} error={reportsError} openId={doc.id} onOpen={handleOpen} onDownload={setPrintTarget}/>
              )}
            </div>
          </div>
        </aside>
      </div>

      <PrintableReport report={printReport} patient={patient} authorName={authorName}/>

      {dialog && <ChoiceDialog {...dialog} onCancel={() => setDialog (null)}/>}
    </div>
  );
}
