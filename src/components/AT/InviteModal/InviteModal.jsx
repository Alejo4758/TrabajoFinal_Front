import { useState } from 'react';
import Modal from '../Modal/Modal';
import AccessEditor from '../AccessEditor/AccessEditor';
import { ACCESS_SECTIONS, NETWORK_ROLES, defaultAccessFor, roleInfo, validateInvite } from '../../../utils/networkModel';

const controlClass =
  'w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:ring-2 focus:ring-primary/20';
const okBorder = 'border-border focus:border-primary';
const badBorder = 'border-red-600 focus:border-red-600';

function Field({ id, label, optional, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-text">
        {label}{optional && <span className="font-normal text-text-muted"> (opcional)</span>}
      </label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

// Formulario para invitar a una persona a la red de apoyo.
// Props: onSave(datos) -> Promise<integrante>, onClose(), onInvited(integrante)
export default function InviteModal({ onSave, onClose, onInvited }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [relationship, setRelationship] = useState('');
  const [access, setAccess] = useState([]);
  const [accessTouched, setAccessTouched] = useState(false); // si el AT ya ajustó los accesos, el cambio de rol no los pisa
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [sending, setSending] = useState(false);

  const clear = (field) => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setServerError('');
  };

  const changeRole = (value) => {
    setRole(value);
    if (!accessTouched) setAccess(value ? defaultAccessFor(value) : []);
    clear('role');
    clear('access');
  };

  const focusFirst = (found) => {
    const first = Object.keys(found).find((key) => found[key]);
    const ids = { name: 'invite-name', email: 'invite-email', role: 'invite-role', access: `invite-access-${ACCESS_SECTIONS[0].id}`, consent: 'invite-consent' };
    if (first) document.getElementById(ids[first])?.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const found = validateInvite({ name, email, role, access, consent });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirst(found);
      return;
    }

    setSending(true);
    setServerError('');
    try {
      const member = await onSave({ name: name.trim(), email: email.trim(), role, relationship: relationship.trim(), access });
      onInvited(member);
      onClose();
    } catch (err) {
      if (err.code === 'duplicate') {
        setErrors({ email: err.message });
        document.getElementById('invite-email')?.focus();
      } else {
        setServerError(err.message || 'No pudimos enviar la invitación. Intentá nuevamente.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      title="Invitar a la red de apoyo"
      titleId="invite-title"
      onClose={onClose}
      busy={sending}
      onSubmit={handleSubmit}
      size="max-w-xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={sending} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold transition hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">
            Cancelar
          </button>
          <button type="submit" disabled={sending} className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
            {sending ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="m-0 text-sm text-text-secondary">
          La persona va a recibir un enlace por correo para crear su usuario. Vence a los 7 días.
        </p>

        {serverError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">{serverError}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="invite-email" label="Correo electrónico" error={errors.email}>
            <input id="invite-email" type="email" autoComplete="off" value={email} placeholder="persona@correo.com" onChange={(e) => { setEmail(e.target.value); clear('email'); }}
              aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'invite-email-error' : undefined} className={`${controlClass} ${errors.email ? badBorder : okBorder}`} />
          </Field>
          <Field id="invite-name" label="Nombre" optional error={errors.name}>
            <input id="invite-name" type="text" autoComplete="off" maxLength={80} value={name} onChange={(e) => { setName(e.target.value); clear('name'); }}
              aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'invite-name-error' : undefined} className={`${controlClass} ${errors.name ? badBorder : okBorder}`} />
          </Field>
          <Field id="invite-role" label="Rol en el acompañamiento" error={errors.role}>
            <select id="invite-role" value={role} onChange={(e) => changeRole(e.target.value)} aria-invalid={Boolean(errors.role)} aria-describedby={errors.role ? 'invite-role-error' : undefined} className={`${controlClass} ${errors.role ? badBorder : okBorder}`}>
              <option value="">Elegí una opción</option>
              {NETWORK_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field id="invite-relationship" label="Vínculo" optional>
            <input id="invite-relationship" type="text" maxLength={80} value={relationship} placeholder={roleInfo(role)?.hint ?? 'Ej.: madre, docente de grado'} onChange={(e) => setRelationship(e.target.value)} className={`${controlClass} ${okBorder}`} />
          </Field>
        </div>

        <AccessEditor idPrefix="invite-access" value={access} onChange={(next) => { setAccess(next); setAccessTouched(true); clear('access'); }} error={errors.access} />

        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input id="invite-consent" type="checkbox" checked={consent} onChange={(e) => { setConsent(e.target.checked); clear('consent'); }} aria-describedby={errors.consent ? 'invite-consent-error' : undefined} className="mt-0.5 size-5 shrink-0 accent-primary" />
            <span className="text-sm text-text">Confirmo que la persona acompañada, o su responsable, autorizó compartir esta información con quien invito.</span>
          </label>
          {errors.consent && <p id="invite-consent-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.consent}</p>}
        </div>
      </div>
    </Modal>
  );
}
