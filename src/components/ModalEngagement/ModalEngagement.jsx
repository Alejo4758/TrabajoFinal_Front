import { useEffect, useState } from 'react';
import { sendLinkRequest } from '../../services/modalRequestService';
import { DESCRIPTION_MAX, DESCRIPTION_MIN } from '../../utils/constants';
import FormField from '../FormField/FormField';
import Icon from "../Icon/Icon";

function Chip ({ id, selected, onClick, children }) {
  return (
    <button id={id} type="button" onClick={onClick}
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-text hover:border-primary/50'
      }`}
    >
      {selected && <span>✓ </span>}
      {children}
    </button>
  );
}

function FieldError ({ id, message }) {
  if (!message) return null;
  return <p id={id} role="alert" className="mt-1.5 text-sm text-red-600">{message}</p>;
}

export default function ModalEngagement ({ at, atId, onClose, onSuccess }) {
  const zones = at.locality ?? [];
  const programs = at.socialPrograms ?? [];

  const [form, setForm] = useState({ description: "", locality: zones.length === 1 ? zones[0] : "", socialPrograms: [], otherCoverage: false });
  const [errors, setErrors] = useState ({});
  const [serverError, setServerError] = useState ("");
  const [sending, setSending] = useState (false);
  const [sent, setSent] = useState (false);

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape' && !sending) onClose(); };
    window.addEventListener ("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener ("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [sending, onClose]);

  const clear = field => {
    setErrors(prev => ({ ...prev, [field]: "" }));
    setServerError ("");
  };

  const handleChange = event => {
    const { name, value } = event.target;
    setForm (prev => ({ ...prev, [name]: value }));
    clear (name);
  };

  const toggleProgram = name => {
    setForm (prev => ({ ...prev, socialPrograms: prev.socialPrograms.includes(name) ? prev.socialPrograms.filter((p) => p !== name) : [...prev.socialPrograms, name] }));
    clear ("coverage");
  };

  const toggleOther = () => {
    setForm (prev => ({ ...prev, otherCoverage: !prev.otherCoverage }));
    clear ("coverage");
  };

  const validate = () => {
    const found = {};
    const description = form.description.trim ();
    if (!description) found.description = "Contá brevemente el caso";
    else if (description.length < DESCRIPTION_MIN) found.description = `Escribí al menos ${DESCRIPTION_MIN} caracteres para que el profesional pueda entender el caso`;
    if (!form.locality.trim ()) found.locality = zones.length > 0 ? "Seleccioná la zona donde necesitás el acompañamiento" : "Indicá la zona de trabajo";
    if (form.socialPrograms.length === 0 && !form.otherCoverage) found.coverage = "Seleccioná al menos una opción";
    return found;
  };

  const handleSubmit = async event => {
    event.preventDefault ();
    const found = validate ();
    setErrors (found);
    const firstInvalid = Object.keys (found)[0];
    if (firstInvalid) {
      document.getElementById (`link-${firstInvalid}`)?.focus ();
      return;
    }
    setSending (true);
    setServerError ("");

    try {
      const result = await sendLinkRequest ( atId, 
        { 
            description: form.description.trim (), 
            locality: form.locality.trim (), 
            socialPrograms: form.socialPrograms, 
            otherCoverage: form.otherCoverage 
        });

      if (result.status === 201) {
        setSent (true);
        onSuccess ?. ();
        return;
      }
      if (result.status === 400) {
        setServerError (result.error || "Los datos ingresados no son válidos");
        return;
      }
      if (result.status === 409) {
        setServerError (result.error || "Ya enviaste una solicitud a este profesional");
        return;
      }
      setServerError (result.error || "No se pudo enviar la solicitud");
    } 
    catch {
      setServerError ("Ocurrió un error inesperado. Intentá nuevamente");
    } 
    finally {
      setSending (false);
    }
  };

  const otherChipIsFirst = programs.length === 0;

  return (
    <div className="fixed inset-0 flex justify-center items-end bg-black/40 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        {sent ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name={"check"} className={"h-7 w-7"}/>
            </div>
            <h2 className="m-0 text-2xl font-bold text-text">
                Solicitud enviada
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              {at.name} va a revisar tu caso. Si acepta la solicitud, podrán comunicarse por el chat de la plataforma
            </p>
            <button onClick={onClose} className="mt-7 cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
                Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="m-0 text-2xl font-bold text-text">
                    Solicitar vinculación
                </h2>
                <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">
                  Contale a {at.name} sobre el caso para que pueda decidir si lo acepta
                </p>
              </div>
              <button onClick={onClose} disabled={sending} className="flex-none cursor-pointer rounded-lg p-2 text-text-secondary transition hover:bg-surface-alt hover:text-text focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50">
                    <Icon name={"close"}/>
              </button>
            </div>

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                {serverError}
              </div>
            )}

            <div>
              <FormField as="textarea" id="description"
                name="description"
                label="Descripción breve del caso"
                rows={4}
                maxLength={DESCRIPTION_MAX}
                placeholder="Necesito acompañamiento para mi hijo de 8 años en el horario escolar..."
                value={form.description}
                onChange={handleChange}
                error={errors.description}
                hint={`${form.description.length}/${DESCRIPTION_MAX} caracteres`}
              />
            </div>
            <div>
              {zones.length > 0 ? (
                <FormField
                  as="select"
                  id="locality"
                  name="locality"
                  label="Zona de trabajo"
                  value={form.locality}
                  onChange={handleChange}
                  error={errors.locality}
                  hint={`Zonas donde trabaja ${at.name}`}
                >
                    <option value="">
                        Seleccioná una zona
                    </option>
                    {zones.map(zone => (<option key={zone} value={zone}>{zone}</option>))}
                </FormField>
              ) : (
                <FormField
                  id="locality"
                  name="locality"
                  label="Zona de trabajo"
                  placeholder="Ingresá la localidad"
                  value={form.locality}
                  onChange={handleChange}
                  error={errors.locality}
                />
              )}
            </div>
            <div>
                <p className="m-0 mb-2 text-sm font-medium text-text">
                    Obras sociales con las que contás
                </p>
                <div className="flex flex-wrap gap-2">
                    {programs.map((program, index) => (
                        <Chip key={program} id={index === 0 ? "link-coverage" : undefined} selected={form.socialPrograms.includes(program)} onClick={() => toggleProgram(program)}>
                            {program}
                        </Chip>
                    ))}
                <Chip id={otherChipIsFirst ? "link-coverage" : undefined} selected={form.otherCoverage} onClick={toggleOther}>
                    Otra o ninguna de estas
                </Chip>
              </div>
              <FieldError id="link-coverage-error" message={errors.coverage}/>
              {!errors.coverage && <p className="m-0 mt-1.5 text-xs text-text-secondary">Podés elegir más de una. Se muestran las que acepta {at.name}</p>}
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={sending} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
                Cancelar
              </button>
              <button type="submit" disabled={sending} className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
                {sending ? 'Enviando...' : "Enviar solicitud"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}