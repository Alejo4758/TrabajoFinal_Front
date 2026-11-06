import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { getMyClientCalendar, updateCalendarActivity } from "../../services/calendarService";
import { useCalendarRealtime } from "../../hooks/useCalendarRealtime";
import { ACTIVITY_TYPES, ACTIVITY_STATES, formatDateTime, formatTime, fullName, parseDate, safeText, sortByStart } from "./calendarUtils";

// El backend puede anidar al profesional de distintas formas; se busca el nombre sin asumir una sola
const professionalName = activity => fullName (activity.profileAT?.user) || fullName (activity.profileAT) || fullName (activity.at) || "Acompañante terapéutico";

export default function ClientCalendar ({ userId }) {
  const [activities, setActivities] = useState ([]);
  const [loading, setLoading] = useState (true);
  const [error, setError] = useState (null);
  const [actionError, setActionError] = useState (null);
  const [busyId, setBusyId] = useState (null);
  const [reloadTick, setReloadTick] = useState (0);

  const reload = useCallback (() => setReloadTick (tick => tick + 1), []);

  useCalendarRealtime (userId, reload);

  useEffect (() => {
    let cancelled = false;

    getMyClientCalendar ().then (result => {
      if (cancelled) return;
      setActivities (sortByStart (result.data));
      setError (result.error);
      setLoading (false);
    });

    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const cancelActivity = async activity => {
    if (!window.confirm ("¿Querés cancelar este turno?")) return;

    setBusyId (activity.id);
    setActionError (null);
    const result = await updateCalendarActivity (activity.id, { state: "CANCELLED" });
    setBusyId (null);

    if (result.error || result.warning) {
      setActionError (result.error || result.warning);
      return;
    }

    reload ();
  };

  return (
    <main className="min-h-page bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="m-0 text-3xl font-bold text-text">Mis turnos y entrevistas</h1>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{actionError}</div>}

        {loading ? (
          <p className="text-sm text-text-secondary">Cargando turnos...</p>
        ) : activities.length === 0 && !error ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="m-0 text-text-secondary">Todavía no tenés turnos. Podés solicitar una entrevista desde el perfil de un acompañante.</p>
            <Link to="/searchAT" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover">Buscar acompañantes</Link>
          </div>
        ) : (
          <ul className="m-0 list-none space-y-4 p-0">
            {activities.map (activity => {
              const state = ACTIVITY_STATES[activity.state];
              const start = parseDate (activity.startDate);
              const cancelable = (activity.state === "PENDING" || activity.state === "CONFIRMED") && start && start > new Date ();

              return (
                <li key={activity.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className={`m-0 break-words text-lg font-semibold text-text ${activity.state === "CANCELLED" ? "line-through opacity-60" : ""}`}>
                        {ACTIVITY_TYPES[activity.type]?.label ?? "Turno"} con {professionalName (activity)}
                      </h2>
                      <p className="m-0 mt-1 text-sm text-text-secondary">{formatDateTime (activity.startDate)} a {formatTime (activity.finishDate)}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-medium ${state?.badge ?? ""}`}>{state?.label ?? "—"}</span>
                  </div>
                  {safeText (activity.ubication) && <p className="m-0 mt-2 text-sm text-text-secondary">Lugar: {safeText (activity.ubication)}</p>}
                  {safeText (activity.description) && <p className="m-0 mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{safeText (activity.description)}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to="/chat" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-alt">Ir al chat</Link>
                    {cancelable && (
                      <button type="button" disabled={busyId === activity.id} onClick={() => cancelActivity (activity)} className="cursor-pointer rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
                        Cancelar turno
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
