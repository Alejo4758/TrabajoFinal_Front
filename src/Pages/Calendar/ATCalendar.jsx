import { useCallback, useEffect, useMemo, useState } from "react";
import { getMyATCalendar, getATLinkedPatients, getHolidaysByYear, updateCalendarActivity } from "../../services/calendarService";
import { useCalendarRealtime } from "../../hooks/useCalendarRealtime";
import { ACTIVITY_TYPES, ACTIVITY_STATES, WEEKDAYS, buildMonthGrid, dateKey, formatLongDate, formatMonth, formatTime, formatDateTime, fullName, holidaysToMap, parseDate, safeText, sortByStart } from "./calendarUtils";
import ActivityModal from "./ActivityModal";

const FILTERS = [{ value: "ALL", label: "Todas" }, ...Object.entries (ACTIVITY_TYPES).map (([value, { label }]) => ({ value, label }))];

const isCancelled = activity => activity.state === "CANCELLED";

export default function ATCalendar ({ userId }) {
  const today = new Date ();
  const [viewDate, setViewDate] = useState (new Date (today.getFullYear (), today.getMonth (), 1));
  const [selectedKey, setSelectedKey] = useState (dateKey (today));
  const [activities, setActivities] = useState ([]);
  const [patients, setPatients] = useState ([]);
  const [holidaysByYear, setHolidaysByYear] = useState ({});
  const [filter, setFilter] = useState ("ALL");
  const [showCancelled, setShowCancelled] = useState (false);
  const [loading, setLoading] = useState (true);
  const [error, setError] = useState (null);
  const [actionError, setActionError] = useState (null);
  const [busyId, setBusyId] = useState (null);
  const [modal, setModal] = useState (null); // { activity } | null
  const [reloadTick, setReloadTick] = useState (0);

  const grid = useMemo (() => buildMonthGrid (viewDate), [viewDate]);
  const rangeStart = grid[0].getTime ();
  const rangeEnd = grid[41].getTime ();

  const reload = useCallback (() => setReloadTick (tick => tick + 1), []);

  useCalendarRealtime (userId, reload);

  // Agenda del rango visible
  useEffect (() => {
    let cancelled = false;

    const start = new Date (rangeStart);
    const end = new Date (rangeEnd);
    end.setHours (23, 59, 59, 999);

    // Se pide siempre con canceladas y se filtra en pantalla: alternar el switch no vuelve a llamar al backend
    getMyATCalendar ({ start: start.toISOString (), end: end.toISOString (), includeCancelled: true }).then (result => {
      if (cancelled) return;
      setActivities (result.data);
      setError (result.error);
      setLoading (false);
    });

    return () => {
      cancelled = true;
    };
  }, [rangeStart, rangeEnd, reloadTick]);

  // Pacientes vinculados (una sola vez)
  useEffect (() => {
    let cancelled = false;

    getATLinkedPatients ().then (result => {
      if (cancelled) return;
      setPatients (result.data.filter (item => item?.id != null));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Feriados de los años que toca la grilla
  useEffect (() => {
    let cancelled = false;
    const years = [...new Set ([new Date (rangeStart).getFullYear (), new Date (rangeEnd).getFullYear ()])];

    years.filter (year => !(year in holidaysByYear)).forEach (year => {
      getHolidaysByYear (year).then (result => {
        if (!cancelled) setHolidaysByYear (prev => ({ ...prev, [year]: holidaysToMap (result.data) }));
      });
    });

    return () => {
      cancelled = true;
    };
  }, [rangeStart, rangeEnd, holidaysByYear]);

  const holidays = useMemo (() => Object.assign ({}, ...Object.values (holidaysByYear)), [holidaysByYear]);

  const visible = useMemo (() => activities.filter (activity => (filter === "ALL" || activity.type === filter) && (showCancelled || !isCancelled (activity))), [activities, filter, showCancelled]);

  const byDay = useMemo (() => {
    const map = {};
    for (const activity of sortByStart (visible)) {
      const start = parseDate (activity.startDate);
      if (start) (map[dateKey (start)] ??= []).push (activity);
    }
    return map;
  }, [visible]);

  const pending = useMemo (() => sortByStart (activities.filter (activity => activity.type === "INTERVIEW" && activity.state === "PENDING")), [activities]);

  const changeState = async (activity, state) => {
    setBusyId (activity.id);
    setActionError (null);
    const result = await updateCalendarActivity (activity.id, { state });
    setBusyId (null);

    if (result.warning || result.error) {
      setActionError (result.error || result.warning);
      return;
    }

    reload ();
  };

  const goToMonth = offset => setViewDate (current => new Date (current.getFullYear (), current.getMonth () + offset, 1));

  const goToday = () => {
    const now = new Date ();
    setViewDate (new Date (now.getFullYear (), now.getMonth (), 1));
    setSelectedKey (dateKey (now));
  };

  const closeModal = () => setModal (null);

  const handleSaved = () => {
    setModal (null);
    reload ();
  };

  const selectedDate = parseDate (`${selectedKey}T00:00`) ?? today;
  const dayActivities = byDay[selectedKey] ?? [];

  return (
    <main className="min-h-page bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="m-0 text-3xl font-bold text-text">Mi agenda</h1>
          <div className="flex flex-wrap items-center gap-3">
            <select value={filter} onChange={event => setFilter (event.target.value)} aria-label="Filtrar por tipo" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary">
              {FILTERS.map (({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
              <input type="checkbox" checked={showCancelled} onChange={event => setShowCancelled (event.target.checked)} className="size-4 accent-primary"/>
              Mostrar canceladas
            </label>
            <button type="button" onClick={() => setModal ({ activity: null })} className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
              + Agendar actividad / recordatorio
            </button>
          </div>
        </header>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {actionError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{actionError}</div>}

        {pending.length > 0 && (
          <section aria-label="Solicitudes de entrevista pendientes" className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="m-0 mb-3 text-lg font-bold text-amber-900">Solicitudes de entrevista pendientes ({pending.length})</h2>
            <ul className="m-0 list-none space-y-3 p-0">
              {pending.map (activity => (
                <li key={activity.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    {/* activity.patient es para quién es la entrevista; activity.user, el titular de la cuenta que la pidió */}
                    <p className="m-0 font-semibold text-text">{fullName (activity.patient) || fullName (activity.user) || "Paciente"}</p>
                    {fullName (activity.patient) && fullName (activity.user) && fullName (activity.user) !== fullName (activity.patient) && <p className="m-0 text-sm text-text-secondary">La pidió {fullName (activity.user)}</p>}
                    <p className="m-0 text-sm text-text-secondary">{formatDateTime (activity.startDate)} a {formatTime (activity.finishDate)}</p>
                    {safeText (activity.description) && <p className="m-0 mt-1 break-words text-sm text-text-secondary">{safeText (activity.description)}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busyId === activity.id} onClick={() => changeState (activity, "CONFIRMED")} className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60">Confirmar</button>
                    <button type="button" disabled={busyId === activity.id} onClick={() => setModal ({ activity })} className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-alt disabled:opacity-60">Reprogramar</button>
                    <button type="button" disabled={busyId === activity.id} onClick={() => changeState (activity, "CANCELLED")} className="cursor-pointer rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60">Rechazar</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section aria-label="Calendario mensual" className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="m-0 text-xl font-bold capitalize text-text">{formatMonth (viewDate)}</h2>
              <div className="flex gap-2">
                <button type="button" onClick={() => goToMonth (-1)} aria-label="Mes anterior" className="cursor-pointer rounded-xl border border-border px-3 py-2 text-sm text-text transition hover:bg-surface-alt">&lt;</button>
                <button type="button" onClick={goToday} className="cursor-pointer rounded-xl border border-border px-3 py-2 text-sm font-semibold text-text transition hover:bg-surface-alt">Hoy</button>
                <button type="button" onClick={() => goToMonth (1)} aria-label="Mes siguiente" className="cursor-pointer rounded-xl border border-border px-3 py-2 text-sm text-text transition hover:bg-surface-alt">&gt;</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-text-muted">
              {WEEKDAYS.map (day => <div key={day} className="py-2">{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
              {grid.map (day => {
                const key = dateKey (day);
                const items = byDay[key] ?? [];
                const holiday = holidays[key];
                const outside = day.getMonth () !== viewDate.getMonth ();
                const selected = key === selectedKey;

                return (
                  <button key={key} type="button" onClick={() => setSelectedKey (key)} aria-pressed={selected} aria-label={`${formatLongDate (day)}${holiday ? `, feriado: ${holiday}` : ""}, ${items.length} actividades`}
                    className={`flex min-h-20 cursor-pointer flex-col items-stretch gap-1 p-1 text-left transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary sm:min-h-24 ${holiday ? "bg-amber-50" : "bg-surface"} ${outside ? "opacity-50" : ""} hover:bg-surface-alt`}>
                    <span className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${selected ? "bg-primary text-white" : key === dateKey (today) ? "border border-primary text-primary" : "text-text"}`}>{day.getDate ()}</span>
                    {holiday && <span className="truncate rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-800" title={holiday}>{holiday}</span>}
                    {items.slice (0, 2).map (activity => (
                      <span key={activity.id} className={`truncate rounded border px-1 text-[10px] font-medium ${ACTIVITY_TYPES[activity.type]?.pill ?? ACTIVITY_TYPES.OTHER.pill} ${isCancelled (activity) ? "line-through opacity-60" : ""}`}>
                        {formatTime (activity.startDate)} {safeText (activity.title)}
                      </span>
                    ))}
                    {items.length > 2 && <span className="px-1 text-[10px] text-text-muted">+{items.length - 2} más</span>}
                  </button>
                );
              })}
            </div>
          </section>

          <aside aria-label="Agenda del día" className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="m-0 text-lg font-bold capitalize text-text">{formatLongDate (selectedDate)}</h2>
            {holidays[selectedKey] && <p className="m-0 mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">Feriado nacional: {holidays[selectedKey]}</p>}

            {loading ? (
              <p className="mt-4 text-sm text-text-secondary">Cargando agenda...</p>
            ) : dayActivities.length === 0 ? (
              <p className="mt-4 text-sm text-text-secondary">No hay actividades para este día</p>
            ) : (
              <ul className="m-0 mt-4 list-none space-y-3 p-0">
                {dayActivities.map (activity => {
                  const state = ACTIVITY_STATES[activity.state];
                  const type = ACTIVITY_TYPES[activity.type];
                  const patient = fullName (activity.patient);

                  return (
                    <li key={activity.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold text-text-secondary">{formatTime (activity.startDate)} – {formatTime (activity.finishDate)}</p>
                          <h3 className={`m-0 mt-0.5 break-words font-semibold text-text ${isCancelled (activity) ? "line-through opacity-60" : ""}`}>{safeText (activity.title) || "Sin título"}</h3>
                        </div>
                        <span className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-medium ${type?.pill ?? ""}`}>{type?.label ?? "Otro"}</span>
                      </div>
                      {patient && <p className="m-0 mt-2 text-sm text-text">Paciente: {patient}</p>}
                      {safeText (activity.ubication) && <p className="m-0 mt-1 text-sm text-text-secondary">Lugar: {safeText (activity.ubication)}</p>}
                      {safeText (activity.description) && <p className="m-0 mt-1 whitespace-pre-line break-words text-sm text-text-secondary">{safeText (activity.description)}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${state?.badge ?? ""}`}>{state?.label ?? "—"}</span>
                        <select value={activity.state} disabled={busyId === activity.id} onChange={event => changeState (activity, event.target.value)} aria-label="Cambiar estado" className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none focus:border-primary">
                          {Object.entries (ACTIVITY_STATES).map (([value, { label }]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <button type="button" onClick={() => setModal ({ activity })} className="cursor-pointer rounded-lg border border-border px-3 py-1 text-xs font-semibold text-text transition hover:bg-surface-alt">Editar / reprogramar</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {modal && <ActivityModal activity={modal.activity} defaultDate={selectedKey} patients={patients} holidays={holidays} onClose={closeModal} onSaved={handleSaved}/>}
    </main>
  );
}
