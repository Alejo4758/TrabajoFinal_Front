import { useParams, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getPatient } from "../../../services/patientService";
import { initials, formatDate } from "../../../utils/utils";
import Pill from "../../../components/AT/Pill/Pill";
import Summary from "./Tabs/Summary";
import Evolution from "./Tabs/Evolution";
import Encounters from "./Tabs/Encounters";
import SupportNetwork from "./Tabs/SupportNetwork";
import Reports from "./Tabs/Reports";
import WorkPlan from "./Tabs/WorkPlan";

const TABS = [
  { id: "summary", label: "Resumen", Component: Summary },
  { id: "workPlan", label: "Plan de trabajo", Component: WorkPlan },
  { id: "encounters", label: "Encuentros", Component: Encounters },
  { id: "evolution", label: "Evolución", Component: Evolution },
  { id: "supportNetwork", label: "Red de apoyo", Component: SupportNetwork },
  { id: "reports", label: "Informes", Component: Reports }
];

function HubSkeleton () {
    return (
        <div className="animate-pulse space-y-6">
            <div className="h-40 rounded-xl bg-surface-alt"/>
            <div className="h-12 rounded-xl bg-surface-alt"/>
            <div className="h-72 rounded-xl bg-surface-alt"/>
        </div>
    );
}

export default function PatientDetail () {
    const { id } = useParams ();
    
    const [searchParams] = useSearchParams ();

    const [patient, setPatient] = useState (null);
    const [loading, setLoading] = useState (false);
    const [error, setError] = useState ("");

    const load = async () => {
        setLoading (true);
        setError ("");
        try {
            setPatient (await getPatient (id));
        }
        catch (e) {
            setPatient (null);
            setError (e.message || "Hubo un error al cargar al paciente");
        }
        finally {
            setLoading (false);
        }

    }

    useEffect (() => {
        load ();
    }, [id]);

    const requested = searchParams.get ("tab");
    const activeTab = TABS.find (tab => tab.id === requested) ?? TABS[0];
    const ActiveComponent = activeTab.Component;

    return (
        <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
            {loading && <HubSkeleton/>}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-sm text-red-600">
                        {error}
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        <button type="button" onClick={load} className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
                            Reintentar
                        </button>
                        <Link to="/dashboardAT" className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface-alt">
                            Volver
                        </Link>
                    </div>
                </div>
            )}

            {!loading && !error && patient && (
                <>
                    <header className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                        <nav className="mb-5 text-sm text-text-muted">
                            <Link to="/dashboardAT" className="hover:text-primary hover:underline">
                                Dashboard
                            </Link>
                            <span className="mx-2">
                                /
                            </span>
                            <span className="text-text">
                                {patient.name}
                            </span>
                        </nav>
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="grid size-16 shrink-0 place-items-center rounded-full bg-primary-light text-xl font-bold text-primary sm:size-20 sm:text-2xl">
                                    {initials (patient.name)}
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                                        {patient.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-text-muted">
                                        {patient.age} años · Última actividad: {patient.lastActivity}
                                    </p>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <Pill tone={patient.status === "Activo" ? "success" : "neutral"}>
                                            {patient.status}
                                        </Pill>
                                        <span className="text-xs text-text-muted">
                                            {patient.nextMeeting ? `Próximo encuentro: ${formatDate (patient.nextMeeting.date, { day: "numeric", month: "short" })}, ${patient.nextMeeting.time}` : "Sin encuentros próximos"}
                                        </span>                                     
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    <nav className="-mx-5 overflow-x-auto border-border border-b px-5 sm:mx-0 sm:px-0">
                        <ul className="flex min-w-max gap-1">
                            {TABS.map (tab => {
                                const active = tab.id === activeTab.id;
                                return (
                                    <li key={tab.id}>
                                        <Link to={`?tab=${tab.id}`} replace className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${active ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text"}`}>
                                            {tab.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                    <section>
                        <ActiveComponent patient={patient}/>
                    </section>
                </>
            )}
        </main>
    )
}