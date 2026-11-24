import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import * as defaultService from '../../../../services/networkService';
import Modal from '../../../../components/AT/Modal/Modal';
import AccessEditor from '../../../../components/AT/AccessEditor/AccessEditor';
import InviteModal from '../../../../components/AT/InviteModal/InviteModal';
import { accessLabels, formatInstant, inviteLink, memberStatus, roleLabel } from '../../../../utils/networkModel';

const initials = (text = '') => text.split(/[\s@.]/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const PILL = {
  success: 'bg-success/10 text-success',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-700',
  neutral: 'bg-surface-alt text-text-secondary',
};
const Pill = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[tone]}`}>{children}</span>
);

const smallButton =
  'cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text transition hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50';

function MemberCard({ member, busy, boardHref, onAccess, onRemove, onCopy, onResend, onCancel }) {
  const status = memberStatus(member);
  const displayName = member.name || member.email;
  const statusPill = { active: ['success', 'Activo'], pending: ['warning', 'Invitación pendiente'], expired: ['danger', 'Invitación vencida'] }[status];

  return (
    <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-light font-semibold text-primary" aria-hidden="true">
        {initials(displayName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 className="m-0 truncate font-semibold text-text">{displayName}</h4>
          <Pill tone={statusPill[0]}>{statusPill[1]}</Pill>
        </div>
        <p className="m-0 mt-1 text-sm text-text-secondary">
          {roleLabel(member.role)}{member.relationship ? ` · ${member.relationship}` : ''}
        </p>
        {member.name && <p className="m-0 mt-0.5 break-all text-sm text-text-muted">{member.email}</p>}

        {status === 'active' ? (
          <p className="m-0 mt-2 text-xs text-text-muted">
            Puede ver: <span className="text-text-secondary">{accessLabels(member.access).join(', ') || 'nada habilitado'}</span>
          </p>
        ) : (
          <p className="m-0 mt-2 text-xs text-text-muted">
            Enviada el {formatInstant(member.invitedAt)} · {status === 'expired' ? 'venció' : 'vence'} el {formatInstant(member.expiresAt)}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {status === 'active' && (
            <>
              <Link to={boardHref} aria-label={`Ver el tablero tal como lo ve ${displayName}`} className={smallButton}>Ver su tablero</Link>
              <button type="button" disabled={busy} onClick={(e) => onAccess(member, e.currentTarget)} aria-label={`Editar accesos de ${displayName}`} className={smallButton}>Editar accesos</button>
              <button type="button" disabled={busy} onClick={(e) => onRemove(member, e.currentTarget)} aria-label={`Quitar a ${displayName} de la red`} className={`${smallButton} text-red-600 hover:bg-red-50`}>Quitar de la red</button>
            </>
          )}
          {status === 'pending' && (
            <>
              <button type="button" disabled={busy} onClick={() => onCopy(member)} aria-label={`Copiar el enlace de la invitación de ${displayName}`} className={smallButton}>{member.token ? 'Copiar enlace' : 'Generar enlace'}</button>
              <button type="button" disabled={busy} onClick={() => onResend(member)} aria-label={`Reenviar la invitación a ${displayName}`} className={smallButton}>{busy ? 'Reenviando...' : 'Reenviar'}</button>
              <button type="button" disabled={busy} onClick={(e) => onCancel(member, e.currentTarget)} aria-label={`Cancelar la invitación de ${displayName}`} className={`${smallButton} text-red-600 hover:bg-red-50`}>Cancelar invitación</button>
            </>
          )}
          {status === 'expired' && (
            <>
              <button type="button" disabled={busy} onClick={() => onResend(member)} aria-label={`Volver a invitar a ${displayName}`} className={smallButton}>{busy ? 'Enviando...' : 'Volver a invitar'}</button>
              <button type="button" disabled={busy} onClick={(e) => onCancel(member, e.currentTarget)} aria-label={`Eliminar la invitación vencida de ${displayName}`} className={`${smallButton} text-red-600 hover:bg-red-50`}>Eliminar</button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

// Cambiar los accesos de un integrante
function AccessModal({ member, onSave, onClose }) {
  const [access, setAccess] = useState(member.access);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (access.length === 0) {
      setError('Habilitá al menos una sección. Si no querés que vea nada, quitalo de la red.');
      return;
    }
    setSaving(true);
    setServerError('');
    try {
      await onSave(access);
      onClose();
    } catch (err) {
      setServerError(err.message || 'No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Accesos de ${member.name || member.email}`}
      titleId="access-title"
      onClose={onClose}
      busy={saving}
      onSubmit={submit}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">Cancelar</button>
          <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-70">{saving ? 'Guardando...' : 'Guardar'}</button>
        </>
      }
    >
      <div className="space-y-4">
        {serverError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{serverError}</div>}
        <AccessEditor idPrefix="edit-access" value={access} onChange={(next) => { setAccess(next); setError(''); }} error={error} />
      </div>
    </Modal>
  );
}

// Confirmación de una acción que no se puede deshacer
function ConfirmModal({ title, text, confirmLabel, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || 'No pudimos completar la acción.');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      titleId="confirm-title"
      onClose={onClose}
      busy={busy}
      size="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={busy} className="cursor-pointer rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60">Volver</button>
          <button type="button" onClick={confirm} disabled={busy} className="cursor-pointer rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40 disabled:opacity-70">{busy ? 'Procesando...' : confirmLabel}</button>
        </>
      }
    >
      <p className="m-0 text-sm leading-relaxed text-text-secondary">{text}</p>
      {error && <p role="alert" className="m-0 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}
    </Modal>
  );
}

export default function SupportNetwork({ patient, service = defaultService }) {
  const patientId = patient.id;
  const [members, setMembers] = useState(null); 
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(null); 
  const [actionError, setActionError] = useState('');
  const [modal, setModal] = useState(null); 
  const [busyId, setBusyId] = useState(null);
  const openerRef = useRef(null);

  const load = async () => {
    setMembers(null);
    setLoadError('');
    try {
      setMembers(await service.listNetwork(patientId));
    } catch (err) {
      setLoadError(err.message || 'No pudimos cargar la red de apoyo.');
    }
  };

  useEffect(() => {
    load();
  }, [patientId]);

  const openModal = (next, trigger) => {
    openerRef.current = trigger ?? document.activeElement;
    setNotice(null);
    setActionError('');
    setModal(next);
  };
  const closeModal = () => {
    setModal(null);
    setTimeout(() => openerRef.current?.focus?.(), 0);
  };

  const replace = (member) => setMembers((prev) => prev.map((m) => (m.id === member.id ? member : m)));
  const remove = (member) => setMembers((prev) => prev.filter((m) => m.id !== member.id));

  // Si el correo no salió, la invitación igual existe: se ofrece el enlace para compartirlo a mano
  const sentNotice = (member, text) =>
    member.emailSent === false
      ? { text: `No pudimos enviar el correo a ${member.email}. Copiá el enlace y compartíselo vos:`, link: inviteLink(member.token), manual: true }
      : { text, link: inviteLink(member.token) };

  const handleInvited = (member) => {
    setMembers((prev) => [...prev, member]);
    setNotice(sentNotice(member, `Invitación enviada a ${member.email}.`));
  };

  const writeLink = async (link, text) => {
    try {
      await navigator.clipboard.writeText(link);
      setNotice({ text });
    } catch {
      setNotice({ text: 'No pudimos copiar el enlace automáticamente. Copialo desde acá:', link, manual: true });
    }
  };

  // El backend guarda solo el hash del token: de una invitación del listado no se conoce el enlace.
  // En ese caso se genera uno nuevo (reenviándola) y se copia ese
  const copyLink = async (member) => {
    setActionError('');
    if (member.token) {
      await writeLink(inviteLink(member.token), 'Enlace copiado. Podés pegarlo en un mensaje para compartirlo.');
      return;
    }
    setBusyId(member.id);
    try {
      const updated = await service.resendInvitation(patientId, member.id);
      replace(updated);
      await writeLink(inviteLink(updated.token), 'Generamos un enlace nuevo y lo copiamos (el anterior dejó de servir). Podés pegarlo en un mensaje para compartirlo.');
    } catch (err) {
      setActionError(err.message || 'No pudimos generar el enlace.');
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (member) => {
    setBusyId(member.id);
    setActionError('');
    setNotice(null);
    try {
      const updated = await service.resendInvitation(patientId, member.id);
      replace(updated);
      setNotice(sentNotice(updated, `Invitación enviada de nuevo a ${updated.email}. El enlace anterior dejó de servir.`));
    } catch (err) {
      setActionError(err.message || 'No pudimos reenviar la invitación.');
    } finally {
      setBusyId(null);
    }
  };

  const active = members?.filter((m) => memberStatus(m) === 'active') ?? [];
  const invitations = (members ?? [])
    .filter((m) => memberStatus(m) !== 'active')
    .sort((a, b) => (memberStatus(a) === memberStatus(b) ? 0 : memberStatus(a) === 'pending' ? -1 : 1));
  const pendingCount = invitations.filter((m) => memberStatus(m) === 'pending').length;

  const summary = members
    ? `${active.length} ${active.length === 1 ? 'integrante' : 'integrantes'} · ${pendingCount} ${pendingCount === 1 ? 'invitación pendiente' : 'invitaciones pendientes'}`
    : '';

  const cardProps = (member) => ({
    member,
    boardHref: `/patient/${patientId}/red/${member.id}`,
    busy: busyId === member.id,
    onAccess: (m, trigger) => openModal({ type: 'access', member: m }, trigger),
    onRemove: (m, trigger) => openModal({ type: 'remove', member: m }, trigger),
    onCancel: (m, trigger) => openModal({ type: 'cancel', member: m }, trigger),
    onCopy: copyLink,
    onResend: resend,
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-label="Resumen de la red de apoyo">
        <div>
          <h3 className="m-0 text-base font-bold text-text">Red de apoyo</h3>
          <p className="m-0 mt-1 text-sm text-text-muted">Personas y profesionales que participan del acompañamiento.</p>
          {summary && <p role="status" className="m-0 mt-2 text-sm text-text-secondary">{summary}</p>}
        </div>
        <button
          type="button"
          onClick={(e) => openModal({ type: 'invite' }, e.currentTarget)}
          className="cursor-pointer self-start rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 sm:self-auto"
        >
          Invitar a la red
        </button>
      </section>

      {notice && (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="m-0">{notice.text}</p>
          {notice.link && notice.manual && (
            <input readOnly value={notice.link} aria-label="Enlace de la invitación" onFocus={(e) => e.target.select()} className="mt-3 w-full rounded-md border border-border bg-surface px-3 py-2 text-xs" />
          )}
          {notice.link && !notice.manual && (
            <button type="button" onClick={() => writeLink(notice.link, 'Enlace copiado. Podés pegarlo en un mensaje para compartirlo.')} className="mt-2 cursor-pointer text-sm font-semibold text-primary hover:underline">Copiar enlace</button>
          )}
        </div>
      )}
      {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{actionError}</div>}

      {members === null && !loadError && (
        <div className="animate-pulse space-y-3" role="status" aria-label="Cargando la red de apoyo">
          {[0, 1].map((i) => <div key={i} className="h-28 rounded-xl bg-surface-alt" />)}
        </div>
      )}

      {loadError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="m-0 text-sm text-red-600">{loadError}</p>
          <button type="button" onClick={load} className="mt-4 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">Reintentar</button>
        </div>
      )}

      {members && members.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center sm:p-12">
          <p className="m-0 font-semibold text-text">La red de apoyo está vacía</p>
          <p className="mx-auto m-0 mt-2 max-w-md text-sm text-text-muted">Invitá a familiares, docentes y profesionales vinculados a la persona acompañada para que puedan seguir el acompañamiento.</p>
        </div>
      )}

      {active.length > 0 && (
        <section aria-labelledby="net-active">
          <h3 id="net-active" className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">Integrantes</h3>
          <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
            {active.map((member) => <MemberCard key={member.id} {...cardProps(member)} />)}
          </ul>
        </section>
      )}

      {invitations.length > 0 && (
        <section aria-labelledby="net-invitations">
          <h3 id="net-invitations" className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">Invitaciones</h3>
          <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
            {invitations.map((member) => <MemberCard key={member.id} {...cardProps(member)} />)}
          </ul>
        </section>
      )}

      {modal?.type === 'invite' && (
        <InviteModal onSave={(data) => service.inviteMember(patientId, data)} onInvited={handleInvited} onClose={closeModal} />
      )}
      {modal?.type === 'access' && (
        <AccessModal
          member={modal.member}
          onSave={async (access) => {
            const updated = await service.updateAccess(patientId, modal.member.id, access);
            replace(updated);
            setNotice({ text: 'Accesos actualizados.' });
          }}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'remove' && (
        <ConfirmModal
          title="Quitar de la red de apoyo"
          text={`${modal.member.name || modal.member.email} dejará de tener acceso a la información del acompañamiento. Podés volver a invitarla más adelante.`}
          confirmLabel="Quitar de la red"
          onConfirm={async () => {
            await service.removeMember(patientId, modal.member.id);
            remove(modal.member);
            setNotice({ text: `${modal.member.name || modal.member.email} ya no forma parte de la red.` });
          }}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'cancel' && (
        <ConfirmModal
          title="Cancelar la invitación"
          text={`El enlace enviado a ${modal.member.email} dejará de funcionar.`}
          confirmLabel="Cancelar invitación"
          onConfirm={async () => {
            await service.cancelInvitation(patientId, modal.member.id);
            remove(modal.member);
            setNotice({ text: 'Invitación cancelada.' });
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
}