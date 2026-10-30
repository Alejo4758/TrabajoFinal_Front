import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { getATDashboard } from "../../../services/dashboardService";
import { normalize, initials } from "../../../utils/utils";
import { MAX_PATIENTS_SHOWN } from "../../../utils/constants";
import StatCard from "../../../components/StatCard/StatCard";
import FormField from "../../../components/FormField/FormField";
import Icon from "../../../components/Icon/Icon";

function SectionHeader ({ title, subtitle, to, linkLabel }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {to && (
        <Link to={to} className="shrink-0 text-sm font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function Notification ({ text, time, unread }) {
  return (
    <li className="flex gap-3">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${unread ? 'bg-primary' : 'bg-border'}`} aria-hidden="true" />
      <div>
        <p className="text-sm text-text">
          {unread && <span className="sr-only">Sin leer: </span>}
          {text}
        </p>
        <p className="mt-1 text-xs text-text-muted">{time}</p>
      </div>
    </li>
  );
}

function DashboardSkeleton () {
  return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map (i => (
          <div key={i} className="h-28 rounded-xl bg-surface-alt"/>
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-alt"/>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-56 rounded-xl bg-surface-alt"/>
        <div className="h-56 rounded-xl bg-surface-alt"/>
      </div>
    </div>
  );
}

export default function Dashboard () {
  const [data, setData] = useState (null);
  const [loading, setLoading] = useState (true);
  const [error, setError] = useState ("");
  const [search, setSearch] = useState ("");

  const load = async () => {
    setLoading (true);
    setError ("");
    try {
      setData (await getATDashboard ());
    } catch (err) {
      setError (err.message || "Hubo un problema al cargar tu información");
    } finally {
      setLoading (false);
    }
  };

  useEffect(() => {
    load ();
  }, []);

  const filteredPatients = useMemo (() => {
    if (!data) return [];
    const term = normalize (search.trim ());
    return data.patients.filter (patient => normalize (patient.name).includes (term));
  }, [data, search]);

  const stats = useMemo (() => {
    if (!data) return null;
    return {
      activePatients: data.patients.filter (p => p.status === "Activo").length,
      todayMeetings: data.appointments.filter (a => a.day === "Hoy").length,
    };
  }, [data]);

  const shownPatients = filteredPatients.slice (0, MAX_PATIENTS_SHOWN);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">
      {loading && <DashboardSkeleton/>}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">
            {error}
          </p>
          <button type="button" onClick={load} className="mt-4 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
            Reintentar
          </button>
        </div>
      )}
      {!loading && !error && data && (
        <>
          {data.pendingRequests > 0 && (
            <Link to="/at/solicitudes" className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-white">
                  <Icon name="users"/>
                </span>
                <div>
                  <p className="font-semibold">
                    {data.pendingRequests === 1 ? "Tenés 1 solicitud de vinculación nueva" : `Tenés ${data.pendingRequests} solicitudes de vinculación nuevas`}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Revisá el caso y decidí si querés acompañarlo
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-primary">
                Revisar solicitudes
              </span>
            </Link>
          )}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon="users" label="Pacientes activos" value={String(stats.activePatients)} detail="Acompañamientos en curso"/>
            <StatCard icon="user" label="Solicitudes pendientes" value={String(data.pendingRequests)} detail="Esperan tu respuesta"/>
            <StatCard icon="chat" label="Mensajes sin leer" value={String(data.unreadMessages)} detail="Conversaciones pendientes"/>
            <StatCard icon="calendar" label="Encuentros de hoy" value={String(stats.todayMeetings)} detail="En tu agenda de hoy"/>
          </section>
          <section>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-lg font-bold">
                  Mis pacientes
                </h2>
                <p className="mt-1 text-sm text-text-muted">
                  Seleccioná un paciente para acceder a su información
                </p>
              </div>
              <div className="w-full sm:max-w-xs">
                <FormField id="search" name="search" label="Buscar paciente" type="search" value={search} onChange={event => setSearch (event.target.value)} placeholder="Nombre del paciente..." required={false} icon={<Icon name="search"/>}/>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              {shownPatients.length > 0 ? (
                <ul>
                  {shownPatients.map((patient) => (
                    <li key={patient.id} className="border-b border-border last:border-b-0">
                      <Link to={`/at/pacientes/${patient.id}`} className="flex flex-col gap-3 p-4 transition hover:bg-surface-alt focus:bg-surface-alt focus:outline-none sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-light font-semibold text-primary">
                            {initials (patient.name)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {patient.name}
                            </h3>
                            <p className="text-sm text-text-muted">
                              {patient.age} años · Última actividad: {patient.lastActivity}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className={`inline-flex items-center gap-2 text-xs font-medium ${patient.status === "Activo" ? "text-success" : "text-text-muted"}`}>
                            <span className={`size-2 rounded-full ${patient.status === "Activo" ? "bg-success" : "bg-text-muted"}`}/>
                            {patient.status}
                          </span>
                          <p className="mt-1 text-xs text-text-muted">
                            {patient.nextMeeting ? `Próximo encuentro: ${patient.nextMeeting}` : "Sin encuentros próximos"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-8 text-center text-sm text-text-muted">
                  {search ? 'No se encontraron pacientes con ese nombre' : 'Todavía no tenés pacientes asignados'}
                </p>
              )}
              {filteredPatients.length > MAX_PATIENTS_SHOWN && (
                <Link to="/at/pacientes" className="block border-t border-border p-4 text-center text-sm font-medium text-primary hover:bg-surface-alt">
                  Ver los {filteredPatients.length} pacientes
                </Link>
              )}
            </div>
          </section>
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-xl border border-border bg-surface p-5">
              <SectionHeader title="Mi agenda" subtitle="Próximos encuentros" to="/at/agenda" linkLabel="Ver agenda"/>
              <h3 id="agenda-titulo" className="sr-only">
                Próximos encuentros
              </h3>
              {data.appointments.length > 0 ? (
                <ul className="space-y-4">
                  {data.appointments.map (appointment => (
                    <li key={appointment.id} className="flex gap-4">
                      <div className="min-w-20 rounded-lg bg-primary-light px-3 py-2 text-center">
                        <p className="text-xs font-medium text-primary">
                          {appointment.day}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          {appointment.time}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {appointment.patient}
                        </p>
                        <p className="text-xs text-text-muted">
                          {appointment.type}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
                  No tenés encuentros próximos
                </p>
              )}
            </section>
            <section className="rounded-xl border border-border bg-surface p-5">
              <SectionHeader title="Notificaciones" subtitle="Novedades de tus acompañamientos" to="/at/notificaciones" linkLabel="Ver todas"/>
              <h3 id="notificaciones-titulo" className="sr-only">
                Novedades
              </h3>
              {data.notifications.length > 0 ? (
                <ul className="space-y-4">
                  {data.notifications.map (notification => (
                    <Notification key={notification.id} {...notification}/>
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
                  No tenés notificaciones nuevas
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}