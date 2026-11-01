import { useEffect, useState } from "react";
import { Link } from "react-router";
import { requestInterview } from "../../services/calendarService";
import { combineDateTime } from "../../Pages/Calendar/calendarUtils";
import FormField from "../FormField/FormField";
import Icon from "../Icon/Icon";

const MESSAGE_MAX = 500;
const DURATION_MINUTES = 30;

// Modal para que un cliente sugiera fecha y hora de entrevista. El cliente sale del token: solo se envía el AT
export default function InterviewRequestModal ({ at, onClose, onSuccess }) {
  const [form, setForm] = useState ({ date: "", time: "", message: "" });
  const [errors, setErrors] = useState ({});
  const [serverError, setServerError] = useState ("");
  const [sending, setSending] = useState (false);
  const [sent, setSent] = useState (false);

  useEffect (() => {
    const onKey = event => { if (event.key === "Escape" && !sending) onClose (); };
    window.addEventListener ("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener ("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [sending, onClose]);

  const handleChange = event => {
    const { name, value } = event.target;
    setForm (prev => ({ ...prev, [name]: value }));
    setErrors (prev => ({ ...prev, [name]: "" }));
    setServerError ("");
  };

  const handleSubmit = async event => {
    event.preventDefault ();

    const start = form.date && form.time ? combineDateTime (form.date, form.time) : null;
    const found = {};
    if (!form.date) found.date = "Elegí una fecha";
    else if (start && start <= new Date ()) found.date = "La fecha y hora deben ser futuras";
    if (!form.time) found.time = "Elegí una hora";
    if (!form.message.trim ()) found.message = "Escribí un mensaje para el profesional";
    setErrors (found);
    if (Object.keys (found).length > 0) return;

    const finish = new Date (start.getTime () + DURATION_MINUTES * 60000);

    setSending (true);
    const { error } = await requestInterview ({ profileATId: at.id, startDate: start.toISOString (), finishDate: finish.toISOString (), message: form.message.trim () });
    setSending (false);

    if (error) {
      setServerError (error);
      return;
    }

    setSent (true);
    onSuccess?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="interview-modal-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="check" className="h-7 w-7"/>
            </div>
            <h2 id="interview-modal-title" className="m-0 text-2xl font-bold text-text">Entrevista solicitada</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              {at.name} va a revisar tu propuesta y te avisamos cuando la confirme o proponga otro horario
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/calendario" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover">Ver mis turnos</Link>
              <Link to="/chat" className="rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt">Ir al chat</Link>
              <button type="button" onClick={onClose} className="cursor-pointer rounded-xl px-6 py-3 text-sm font-semibold text-text-secondary transition hover:bg-surface-alt">Cerrar</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="interview-modal-title" className="m-0 text-2xl font-bold text-text">Solicitar entrevista</h2>
                <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">Sugerí un día y horario para conocer a {at.name}. Dura aproximadamente {DURATION_MINUTES} minutos</p>
              </div>
              <button type="button" onClick={onClose} disabled={sending} aria-label="Cerrar" className="flex-none cursor-pointer rounded-lg p-2 text-text-secondary transition hover:bg-surface-alt hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
                <Icon name="close"/>
              </button>
            </div>

            {serverError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">{serverError}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FormField type="date" id="interview-date" name="date" label="Fecha sugerida" value={form.date} onChange={handleChange} error={errors.date}/>
              </div>
              <div>
                <FormField type="time" id="interview-time" name="time" label="Hora sugerida" value={form.time} onChange={handleChange} error={errors.time}/>
              </div>
            </div>

            <div>
              <FormField as="textarea" id="interview-message" name="message" label="Mensaje inicial" rows={4} maxLength={MESSAGE_MAX} value={form.message} onChange={handleChange} error={errors.message} hint={`${form.message.length}/${MESSAGE_MAX} caracteres`} placeholder="Hola, me gustaría conocerte para hablar sobre el acompañamiento..."/>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={sending} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">Cancelar</button>
              <button type="submit" disabled={sending} className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
                {sending ? "Enviando..." : "Solicitar entrevista"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
