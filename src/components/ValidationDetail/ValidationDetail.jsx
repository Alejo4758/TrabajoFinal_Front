import { useState } from "react";
import Icon from "../Icon/Icon";
import { formatDateDetail } from "../../utils/utils";

function DetailField ({ label, value }) {
  return (
    <div>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-1 wrap-break-word font-medium text-text">{value || "No informado"}</p>
    </div>
  );
}

export default function ValidationDetail ({ profile, onBack, onReview, reviewing = false }) {
  const [observations, setObservations] = useState ("");
  const [localError, setLocalError] = useState ("");

  const user = profile.user ?? {};
  const documents = profile.documents ?? [];

  const handleReview = async status => {
    setLocalError ("");

    if (status === "REJECTED" && !observations.trim ()) {
      setLocalError ("Indicá el motivo del rechazo para que el profesional sepa qué debe corregir");
      return;
    }

    const result = await onReview (profile.id, status, observations.trim ());
    if (!result?.success) setLocalError (result?.error || "No se pudo registrar la decisión. Intentá nuevamente");
  };

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <button className="flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary disabled:opacity-50"
       onClick={onBack}
       disabled={reviewing}
      >
        Volver a las solicitudes
      </button>
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon name="user" className="h-6 w-6"/>
          </div>
          <div>
            <h3 className="font-bold text-text">{user.name} {user.lastName}</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <DetailField label="Correo electrónico" value={user.email}/>
          <DetailField label="Fecha de registro" value={formatDateDetail (user.createdAt)}/>
          <DetailField label="Tipo de documento" value={user.documentType}/>
          <DetailField label="Número de documento" value={user.documentNumber}/>
          <DetailField label="Fecha de nacimiento" value={formatDateDetail (profile.dateOfBirth)}/>
          <DetailField label="Género" value={profile.genre}/>
          <div className="sm:col-span-2">
            <DetailField label="Estudios declarados" value={profile.studies}/>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div>
          <h3 className="text-lg font-bold text-text">Documentación presentada</h3>
        </div>
        {documents.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border p-6 text-center">
            <p className="font-medium text-text">No hay documentos cargados</p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {documents.map (document => (
              <article className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="plan" className="h-5 w-5"/>
                  </div>
                  <div className="min-w-0">
                    <p className="wrap-break-word font-semibold text-text">{document.title}</p>
                    <p className="mt-1 text-xs text-text-secondary">Cargado el {formatDateDetail (document.createdAt)}</p>
                  </div>
                </div>
                {document.fileUrl ? (
                  <a className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 
                                text-sm font-semibold text-primary transition hover:bg-primary/5"
                   href={document.fileUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                  >
                    Ver documento
                  </a>
                ) : (
                  <span className="text-sm text-text-muted">Archivo no disponible</span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <h3 className="text-lg font-bold text-text">Resolución de la solicitud</h3>
        <div className="mt-5">
          <label className="mb-2 block text-sm font-semibold text-text" htmlFor="observations">Observaciones</label>

          <textarea className="w-full resize-y rounded-xl border border-border bg-background px-4 py-3
                             text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
           id="observations"
           rows={4}
           value={observations}
           onChange={event => setObservations (event.target.value)}
           disabled={reviewing}
           placeholder="Escribí las observaciones de la revisión..."
          />
        </div>
        {localError && (<p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{localError}</p>)}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
           onClick={() => handleReview("REJECTED")}
           disabled={reviewing}
          >
            {reviewing ? "Procesando..." : "Rechazar solicitud"}
          </button>
          <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => handleReview ("APPROVED")}
            disabled={reviewing || documents.length === 0}
          >
            {reviewing ? "Procesando..." : "Aprobar profesional"}
          </button>
        </div>
      </section>
    </section>
  );
}