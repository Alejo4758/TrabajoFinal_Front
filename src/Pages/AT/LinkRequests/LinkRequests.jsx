import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getReceivedLinkRequests, respondLinkRequest } from "../../../services/modalRequestService";
import { useAuth } from "../../../hooks/useAuth";
import { formatRelativeTime, formatDateDetail, initials } from "../../../utils/utils";
import Icon from "../../../components/Icon/Icon";

const TABS = [
  { status: "PENDING", label: "Pendientes", empty: "No tenés solicitudes pendientes" },
  { status: "ACCEPTED", label: "Aceptadas", empty: "Todavía no aceptaste ninguna solicitud" },
  { status: "REJECTED", label: "Rechazadas", empty: "No rechazaste ninguna solicitud" },
];

const fullName = person => [person?.name, person?.lastName].filter (Boolean).join (" ");

function RequestCard ({ request, responding, onRespond }) {
  const name = fullName (request.client) || "Cliente";
  const coverage = [...(request.socialPrograms ?? []), ...(request.otherCoverage ? ["Otra o ninguna"] : [])];
  const isPending = request.status === "PENDING";

  return (
    <li className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-light font-semibold text-primary">
          {initials (name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">
            {name}
          </h3>
          <p className="text-sm text-text-muted" title={formatDateDetail (request.createdAt)}>
            Enviada {formatRelativeTime (request.createdAt)}
          </p>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-text">
        {request.description}
      </p>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-text-secondary">Zona</dt>
          <dd className="mt-0.5 text-text">{request.locality}</dd>
        </div>
        <div>
          <dt className="font-medium text-text-secondary">Obras sociales</dt>
          <dd className="mt-1 flex flex-wrap gap-1.5">
            {coverage.map (item => (
              <span key={item} className="rounded-lg border border-border bg-background px-2 py-0.5 text-xs text-text">
                {item}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      {isPending ? (
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => onRespond (request, "REJECTED")} disabled={responding} className="cursor-pointer rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60">
            Rechazar
          </button>
          <button type="button" onClick={() => onRespond (request, "ACCEPTED")} disabled={responding} className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
            {responding ? "Guardando..." : "Aceptar"}
          </button>
        </div>
      ) : request.status === "ACCEPTED" && (
        <div className="mt-5 flex justify-end">
          <Link to="/chat" className="inline-flex items-center gap-2 rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/10">
            <Icon name="chat"/>
            Ir al chat
          </Link>
        </div>
      )}
    </li>
  );
}

export default function LinkRequests () {
  const { token } = useAuth ();
  const [status, setStatus] = useState ("PENDING");
  const [requests, setRequests] = useState ([]);
  const [loading, setLoading] = useState (true);
  const [error, setError] = useState ("");
  const [actionError, setActionError] = useState ("");
  const [successMessage, setSuccessMessage] = useState ("");
  const [respondingId, setRespondingId] = useState (null);
  // Cambiarlo vuelve a pedir los datos (botón "Reintentar")
  const [reloadKey, setReloadKey] = useState (0);

  useEffect (() => {
    let cancelled = false;

    getReceivedLinkRequests (token, status).then (result => {
      if (cancelled) return;
      if (result.error) setError (result.error);
      else setRequests (Array.isArray (result.data) ? result.data : []);
      setLoading (false);
    });

    return () => {
      cancelled = true;
    };
  }, [token, status, reloadKey]);

  const changeTab = newStatus => {
    if (newStatus === status) return;
    setLoading (true);
    setError ("");
    setActionError ("");
    setSuccessMessage ("");
    setStatus (newStatus);
  };

  const reload = () => {
    setLoading (true);
    setError ("");
    setReloadKey (key => key + 1);
  };

  const handleRespond = async (request, newStatus) => {
    const name = fullName (request.client) || "este cliente";
    if (newStatus === "REJECTED" && !window.confirm (`¿Rechazar la solicitud de ${name}?`)) return;

    setRespondingId (request.id);
    setActionError ("");
    setSuccessMessage ("");

    const result = await respondLinkRequest (request.id, newStatus, token);

    setRespondingId (null);

    // 409: otra pestaña ya la respondió. Se saca igual de la lista de pendientes
    if (result.error && result.status !== 409) {
      setActionError (result.error);
      return;
    }

    setRequests (previous => previous.filter (item => item.id !== request.id));
    if (result.error) setActionError (result.error);
    else setSuccessMessage (newStatus === "ACCEPTED" ? `Aceptaste la solicitud de ${name}. Ya pueden hablar por el chat` : `Rechazaste la solicitud de ${name}`);
  };

  const currentTab = TABS.find (tab => tab.status === status);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8">
      <div>
        <Link to="/dashboardAT" className="text-sm font-bold text-text-secondary transition-colors hover:text-primary">
          Volver a mi panel
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-text">
          Solicitudes de vinculación
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Revisá cada caso y decidí si querés acompañarlo
        </p>
      </div>

      <div role="tablist" aria-label="Estado de las solicitudes" className="flex gap-2 overflow-x-auto">
        {TABS.map (tab => (
          <button key={tab.status} type="button" role="tab" aria-selected={tab.status === status} onClick={() => changeTab (tab.status)}
            className={`cursor-pointer whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              tab.status === status ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-text hover:border-primary/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {successMessage && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
          {successMessage}
        </div>
      )}
      {actionError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
          {actionError}
        </div>
      )}

      {loading && (
        <div className="animate-pulse space-y-4">
          {[0, 1].map (i => <div key={i} className="h-56 rounded-xl bg-surface-alt"/>)}
        </div>
      )}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            {error}
          </p>
          <button type="button" onClick={reload} className="mt-4 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
            Reintentar
          </button>
        </div>
      )}
      {!loading && !error && (
        requests.length > 0 ? (
          <ul className="space-y-4">
            {requests.map (request => (
              <RequestCard key={request.id} request={request} responding={respondingId === request.id} onRespond={handleRespond}/>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-text-muted">
            {currentTab.empty}
          </p>
        )
      )}
    </div>
  );
}
