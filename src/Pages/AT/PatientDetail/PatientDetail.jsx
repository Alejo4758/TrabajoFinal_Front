import { useParams, useSearchParams, Link } from "react-router";
import { useEffect, useMemo, useState } from "react";

import { getPatient } from "../../../services/patientService";
import { useAuth } from "../../../hooks/useAuth";
import { useContributions } from "../../../hooks/useContributions";
import Contributions from "../../../components/AT/Contributions/Contributions";
import { initials, formatDate } from "../../../utils/utils";

import Pill from "../../../components/AT/Pill/Pill";
import Summary from "./Tabs/Summary";
import Evolution from "./Tabs/Evolution";
import Encounters from "./Tabs/Encounters";
import SupportNetwork from "./Tabs/SupportNetwork";
import Reports from "./Tabs/Reports";
import WorkPlan from "./Tabs/WorkPlan";
import NetworkContributions from "./Tabs/NetworkContributions";

const TABS = [
  { id: "summary", label: "Resumen", Component: Summary },
  { id: "workPlan", label: "Plan de trabajo", Component: WorkPlan },
  { id: "encounters", label: "Encuentros", Component: Encounters },
  { id: "evolution", label: "Evolución", Component: Evolution },
  { id: "supportNetwork", label: "Red de apoyo", Component: SupportNetwork },
  { id: "contributions", label: "Aportes", Component: NetworkContributions },
  { id: "reports", label: "Informes", Component: Reports },
];

function HubSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-xl bg-surface-alt" />
      <div className="h-12 rounded-xl bg-surface-alt" />
      <div className="h-72 rounded-xl bg-surface-alt" />
    </div>
  );
}

export default function PatientDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [searchParams] = useSearchParams();

  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const loadedPatient = await getPatient(id, token);

        if (cancelled) return;

        setPatient(loadedPatient);
        setSessions(loadedPatient.sessions ?? []);
      } catch (e) {
        if (cancelled) return;

        setPatient(null);
        setSessions([]);
        setError(e.message || "Hubo un error al cargar al paciente.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // Quién escribe cuando el AT deja un aporte o responde. En el backend, el autor sale del token
  const viewer = useMemo(() => user ? ({
    key: `user:${user.id}`,
    name: [user.name, user.lastName].filter(Boolean).join(" ") || "Acompañante",
    role: "AT",
    relationship: "",
    isAT: true,
  }) : null, [user]);

  // Un solo pedido de aportes para todo el paciente: los hilos de cada pestaña toman de acá lo suyo
  const contributions = useContributions(id, viewer);

  const renderThread = (target, options = {}) => (
    <Contributions contributions={contributions} target={target} {...options} />
  );

  const handleSessionsChange = (nextSessions) => {
    setSessions(nextSessions);

    // Mantiene patient.sessions sincronizado con el estado compartido.
    setPatient((previous) =>
      previous ? { ...previous, sessions: nextSessions } : previous
    );
  };

  const handlePlanSaved = (plan) => {
    setPatient((previous) =>
      previous ? { ...previous, plan } : previous
    );
  };

  const requested = searchParams.get("tab");
  const activeTab = TABS.find((tab) => tab.id === requested) ?? TABS[0];
  const ActiveComponent = activeTab.Component;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
      {loading && <HubSkeleton />}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>

          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
            >
              Reintentar
            </button>

            <Link
              to="/dashboardAT"
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-alt"
            >
              Volver
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && patient && (
        <>
          <header className="rounded-xl border border-border bg-surface p-5 sm:p-6">
            <nav className="mb-5 text-sm text-text-muted">
              <Link
                to="/dashboardAT"
                className="hover:text-primary hover:underline"
              >
                Dashboard
              </Link>

              <span className="mx-2">/</span>
              <span className="text-text">{patient.name}</span>
            </nav>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary-light text-xl font-bold text-primary sm:size-20 sm:text-2xl">
                  {initials(patient.name)}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                    {patient.name}
                  </h2>

                  <p className="mt-1 text-sm text-text-muted">
                    {patient.age != null && `${patient.age} años · `}
                    Última actividad: {patient.lastActivity}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Pill
                      tone={patient.status === "Activo" ? "success" : "neutral"}
                    >
                      {patient.status}
                    </Pill>

                    <span className="text-xs text-text-muted">
                      {patient.nextMeeting
                        ? `Próximo encuentro: ${formatDate(
                            patient.nextMeeting.date,
                            { day: "numeric", month: "short" }
                          )}, ${patient.nextMeeting.time}`
                        : "Sin encuentros próximos"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <nav className="-mx-5 overflow-x-auto border-b border-border px-5 sm:mx-0 sm:px-0">
            <ul className="flex min-w-max gap-1">
              {TABS.map((tab) => {
                const active = tab.id === activeTab.id;

                return (
                  <li key={tab.id}>
                    <Link
                      to={`?tab=${tab.id}`}
                      replace
                      className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                        active
                          ? "border-primary text-primary"
                          : "border-transparent text-text-secondary hover:text-text"
                      }`}
                    >
                      {tab.label}
                      {tab.id === "contributions" && !active && contributions.unseenCount > 0 && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                          {contributions.unseenCount}
                          <span className="sr-only"> {contributions.unseenCount === 1 ? "aporte nuevo" : "aportes nuevos"}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section>
            <ActiveComponent
              patient={{ ...patient, sessions }}
              sessions={sessions}
              onSessionsChange={handleSessionsChange}
              onPlanSaved={handlePlanSaved}
              renderThread={renderThread}
              contributions={contributions}
            />
          </section>
        </>
      )}
    </main>
  );
}
