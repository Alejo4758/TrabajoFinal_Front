import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { fileSrc, getATProfiles, updateATStatus } from '../../services/adminService';

// Valor de user.role del administrador (ajustalo al que devuelve tu backend).
const ADMIN_ROLE = 'ADMIN';

const STATUS = {
  PENDING: { label: 'Pendientes', badge: 'Pendiente', style: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Aprobados', badge: 'Aprobado', style: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Rechazados', badge: 'Rechazado', style: 'bg-red-100 text-red-700' },
};

const DOC_TYPES = { dni: 'DNI', lc: 'LC', le: 'LE', pasaporte: 'Pasaporte', ci: 'Cédula de identidad' };

const ICONS = {
  check: 'm5 12 4 4L19 6',
  x: 'M6 6l12 12M18 6 6 18',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5',
  search: 'M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z',
  back: 'M19 12H5m6-6-6 6 6 6',
  logout: 'M15 17l5-5-5-5M20 12H9M12 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6',
  shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3.5-10 2.5 2.5 4.5-5',
};

function Ico({ name, className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

function BrandMark({ className = 'h-10 w-10' }) {
  return (
    <div className={`flex ${className} items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20`}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <path d="M12 6 6.5 17M12 6l5.5 11M6.5 17h11" opacity=".7" />
        <circle cx="12" cy="6" r="2.4" fill="currentColor" />
        <circle cx="6.5" cy="17" r="2.4" fill="currentColor" />
        <circle cx="17.5" cy="17" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

/* ---------- Utilidades ---------- */
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('es-AR') : '');

function formatBirth(dateOfBirth) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((dateOfBirth || '').slice(0, 10)); // el backend envía un ISO datetime
  if (!m) return '—';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const today = new Date();
  let age = today.getFullYear() - y;
  if (today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d)) age--;
  return `${String(d).padStart(2, '0')}/${String(mo).padStart(2, '0')}/${y} (${age} años)`;
}

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);
const initials = (p) => `${p.user.name?.[0] ?? ''}${p.user.lastName?.[0] ?? ''}`.toUpperCase();

// Motivo del último rechazo: viene de la Validation más reciente (validations llega ordenado, la más nueva primero).
const lastObservation = (p) => p.validations?.find((v) => v.status === 'REJECTED')?.observations ?? null;

const isImageUrl = (url) => /^data:image\//.test(url) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);

/* ---------- Subcomponentes ---------- */
function StatusBadge({ status }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[status].style}`}>{STATUS[status].badge}</span>;
}

function DataRow({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text">{children}</dd>
    </div>
  );
}

function DocumentItem({ doc }) {
  const [open, setOpen] = useState(false);
  const src = fileSrc(doc.fileUrl);
  return (
    <li className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary/10 text-primary"><Ico name="file" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{doc.title}</p>
          <p className="text-xs text-text-secondary">Subido el {formatDate(doc.createdAt)}</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10">
          {open ? 'Ocultar vista previa' : 'Ver vista previa'}
        </button>
        <a href={src} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface hover:text-primary">
          Abrir en otra pestaña
        </a>
      </div>
      {open &&
        (isImageUrl(doc.fileUrl) ? (
          <img src={src} alt={`Documentación: ${doc.title}`} className="mt-4 max-h-96 w-full rounded-xl border border-border bg-surface object-contain" />
        ) : (
          <iframe title={`Documentación: ${doc.title}`} src={src} className="mt-4 h-96 w-full rounded-xl border border-border bg-surface" />
        ))}
    </li>
  );
}

function DocumentList({ docs }) {
  if (!docs?.length) {
    return <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-text-secondary">Este perfil no tiene documentación adjunta.</p>;
  }
  return <ul className="space-y-3">{docs.map((doc) => <DocumentItem key={doc.id} doc={doc} />)}</ul>;
}

function ActionModal({ mode, profile, loading, error, onCancel, onConfirm }) {
  const isReject = mode === 'reject';
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !loading && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  const submit = (e) => {
    e.preventDefault();
    if (!isReject) return onConfirm();
    const clean = reason.trim();
    if (clean.length < 10) return setReasonError('Indicá el motivo del rechazo (mínimo 10 caracteres).');
    onConfirm(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}>
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
        <h2 id="modal-title" className="text-xl font-bold text-text">
          {isReject ? 'Rechazar perfil' : 'Aprobar perfil'}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {isReject
            ? `El perfil de ${profile.user.name} ${profile.user.lastName} no se mostrará en las búsquedas.`
            : `Al aprobar el perfil de ${profile.user.name} ${profile.user.lastName}, empezará a aparecer en las búsquedas de los solicitantes.`}
        </p>

        {isReject && (
          <div className="mt-4">
            <label htmlFor="reason" className="mb-2 block text-sm font-medium text-text">Motivo del rechazo</label>
            <textarea
              id="reason"
              rows={4}
              maxLength={300}
              autoFocus
              value={reason}
              onChange={(e) => { setReason(e.target.value); setReasonError(''); }}
              aria-invalid={Boolean(reasonError)}
              aria-describedby={reasonError ? 'reason-error' : undefined}
              className={`w-full resize-none rounded-md border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:ring-2 ${
                reasonError ? 'border-red-600 focus:ring-red-600/20' : 'border-border focus:border-primary focus:ring-primary/20'
              }`}
            />
            <div className="mt-1 flex justify-between gap-3 text-sm">
              <p id="reason-error" role="alert" className="text-red-600">{reasonError}</p>
              <span className="ml-auto text-xs text-text-secondary">{reason.length}/300</span>
            </div>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-text hover:bg-background disabled:opacity-60">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isReject ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'
            }`}
          >
            {loading ? 'Guardando...' : isReject ? 'Rechazar perfil' : 'Aprobar perfil'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Panel ---------- */
function Panel() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem('user') || 'null');

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('PENDING');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [modal, setModal] = useState(null); // 'approve' | 'reject' | null
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setProfiles(await getATProfiles());
    } catch (err) {
      setLoadError(err.message || 'No pudimos cargar los perfiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(
    () => Object.keys(STATUS).reduce((acc, s) => ({ ...acc, [s]: profiles.filter((p) => p.status === s).length }), {}),
    [profiles],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter(
      (p) => p.status === filter && (!q || `${p.user.name} ${p.user.lastName} ${p.user.email} ${p.user.documentNumber}`.toLowerCase().includes(q)),
    );
  }, [profiles, filter, query]);

  const selected = profiles.find((p) => p.id === selectedId) ?? null;

  const changeFilter = (status) => {
    setFilter(status);
    setSelectedId(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const openModal = (mode) => {
    setActionError('');
    setModal(mode);
  };

  const handleConfirm = async (reason) => {
    setActionLoading(true);
    setActionError('');
    try {
      const status = modal === 'approve' ? 'APPROVED' : 'REJECTED';
      const updated = await updateATStatus(selected.id, status, reason);
      setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setToast(status === 'APPROVED' ? 'Perfil aprobado: ya aparece en las búsquedas.' : 'Perfil rechazado.');
      setModal(null);
      setSelectedId(null);
    } catch (err) {
      setActionError(err.message || 'No pudimos guardar el cambio. Intentá de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background font-sans">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-lg font-extrabold leading-tight tracking-tight text-text">RedAT</p>
              <p className="text-xs text-text-secondary">Panel de administración</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {admin?.name && <span className="hidden text-sm text-text-secondary sm:inline">{admin.name} {admin.lastName}</span>}
            <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-text hover:border-primary hover:text-primary">
              <Ico name="logout" className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">Validación de acompañantes</h1>
          <p className="mt-1 text-sm text-text-secondary">Revisá la documentación de cada perfil antes de habilitarlo en las búsquedas.</p>
        </div>

        {toast && (
          <div role="status" className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{toast}</div>
        )}

        {loadError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-600">{loadError}</p>
            <button onClick={load} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">Reintentar</button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
            {/* Lista */}
            <section className={selected ? 'hidden lg:block' : ''} aria-label="Perfiles">
              <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-1">
                {Object.entries(STATUS).map(([key, cfg]) => (
                  <button
                    key={key}
                    role="tab"
                    aria-selected={filter === key}
                    onClick={() => changeFilter(key)}
                    className={`rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${filter === key ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'}`}
                  >
                    {cfg.label} <span className="opacity-80">({counts[key] ?? 0})</span>
                  </button>
                ))}
              </div>

              <div className="relative mt-3">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-text-muted"><Ico name="search" className="h-4 w-4" /></span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, correo o documento"
                  aria-label="Buscar perfiles"
                  className="w-full rounded-md border border-border bg-surface py-2.5 pl-10 pr-3 text-sm text-text placeholder:text-text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <ul className="mt-3 space-y-2">
                {loading && <li className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary">Cargando perfiles...</li>}
                {!loading && visible.length === 0 && (
                  <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">
                    {query ? 'No hay resultados para tu búsqueda.' : `No hay perfiles ${STATUS[filter].label.toLowerCase()}.`}
                  </li>
                )}
                {visible.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setSelectedId(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border bg-surface p-3 text-left transition hover:border-primary/50 ${selectedId === p.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
                    >
                      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(p)}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-text">{p.user.name} {p.user.lastName}</span>
                        <span className="block truncate text-xs text-text-secondary">{p.user.email}</span>
                        <span className="block text-xs text-text-secondary">Registrado el {formatDate(p.user.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Detalle */}
            <section className={selected ? '' : 'hidden lg:block'} aria-label="Detalle del perfil">
              {!selected ? (
                <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
                  <span className="text-primary/60"><Ico name="shield" className="h-10 w-10" /></span>
                  <p className="mt-3 font-semibold text-text">Seleccioná un perfil para revisarlo</p>
                  <p className="mt-1 max-w-xs text-sm text-text-secondary">Vas a ver sus datos y la documentación adjunta.</p>
                </div>
              ) : (
                <article className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  <button onClick={() => setSelectedId(null)} className="mb-5 flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary lg:hidden">
                    <Ico name="back" className="h-4 w-4" /> Volver a la lista
                  </button>

                  <header className="flex items-center gap-4">
                    <span className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">{initials(selected)}</span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-xl font-bold text-text">{selected.user.name} {selected.user.lastName}</h2>
                      <p className="text-sm text-text-secondary">Acompañante terapéutico</p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </header>

                  <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                    <DataRow label="Fecha de nacimiento">{formatBirth(selected.dateOfBirth)}</DataRow>
                    <DataRow label="Documento">{DOC_TYPES[selected.user.documentType?.toLowerCase()] ?? selected.user.documentType} {selected.user.documentNumber}</DataRow>
                    <DataRow label="Correo electrónico">
                      {selected.user.email}
                      <span className={`ml-2 text-xs ${selected.user.emailVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {selected.user.emailVerified ? 'Verificado' : 'Sin verificar'}
                      </span>
                    </DataRow>
                    <DataRow label="Fecha de registro">{formatDate(selected.user.createdAt)}</DataRow>
                    {selected.studies && <DataRow label="Estudios">{selected.studies}</DataRow>}
                    {selected.genre && <DataRow label="Género">{selected.genre}</DataRow>}
                  </dl>

                  <h3 className="mb-3 mt-8 text-base font-semibold text-text">Documentación de formación</h3>
                  <DocumentList docs={selected.documents} />

                  {selected.status === 'PENDING' && (
                    <>
                      <p className="mt-6 rounded-xl bg-primary/5 p-4 text-sm leading-relaxed text-text-secondary">
                        Verificá que el documento acredite una formación como acompañante terapéutico y que los datos coincidan con los del perfil.
                      </p>
                      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button onClick={() => openModal('reject')} className="flex items-center justify-center gap-2 rounded-xl border border-red-300 px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                          <Ico name="x" className="h-4 w-4" /> Rechazar
                        </button>
                        <button onClick={() => openModal('approve')} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary-hover">
                          <Ico name="check" className="h-4 w-4" /> Aprobar perfil
                        </button>
                      </div>
                    </>
                  )}

                  {selected.status === 'REJECTED' && lastObservation(selected) && (
                    <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Motivo del rechazo</p>
                      <p className="mt-1 text-sm text-red-700">{lastObservation(selected)}</p>
                    </div>
                  )}
                </article>
              )}
            </section>
          </div>
        )}
      </div>

      {modal && selected && (
        <ActionModal mode={modal} profile={selected} loading={actionLoading} error={actionError} onCancel={() => setModal(null)} onConfirm={handleConfirm} />
      )}
    </main>
  );
}

/* Guardia de rol: el backend también debe validar que quien llame sea administrador. */
export default function PanelAdmin() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!localStorage.getItem('token') || user?.role !== ADMIN_ROLE) return <Navigate to="/login" replace />;
  return <Panel />;
}