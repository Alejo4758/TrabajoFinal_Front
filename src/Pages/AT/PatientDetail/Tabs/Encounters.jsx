import { useMemo, useState } from "react";
import { ActionButton } from "../../../../components/AT/ActionButton/ActionButton";
import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import { normalize, formatDate } from "../../../../utils/utils";
import EmptyState from "../../../../components/AT/EmptyState/EmptyState";
import Pill from "../../../../components/AT/Pill/Pill";
import Field from "../../../../components/AT/Field/Field"

export default function Encounters ({ patient }) {
    const [objective, setObjective] = useState ("");
    const [query, setQuery] = useState ("");
    const [from, setFrom] = useState ("");
    const [to, setTo] = useState ("");

    const clearFilters = () => {
        setObjective ("");
        setQuery ("");
        setFrom ("");
        setTo ("");
    };

    const hasFilters = Boolean (objective || query || from || to);

    const objectives = useMemo(() => [...new Set ([...(patient.plan?.specificGoals ?? []), ...patient.sessions.flatMap (s => s.goals)])], [patient.plan, patient.sessions]);

    const filtered = useMemo (() => {
        const term = normalize (query.trim ());
        return patient.sessions.filter (s => {
            if (objective && !s.goals.includes (objective)) return false;
            if (from && s.date < from) return false;
            if (to && s.date > to) return false;
            if (term && !normalize ([...s.activities, s.observations].join ("")).includes (term)) return false;
            return true;
        }).sort ((a, b) => b.date.localeCompare (a.date));
    }, [patient.sessions, objective, query, from, to]);

    if (patient.sessions.length === 0) {
        return (
            <EmptyState title={"Todavía no registraste encuentros"} text={"Cada encuentro que registres queda en el historial del paciente, con los objetivos trabajados, las actividades y tus observaciones"}>
                <ActionButton>
                    Registrar encuentro
                </ActionButton>
            </EmptyState>
        );
    }

    return (
        <div className="space-y-6">
            <CardPatientDetail title={"Historial de encuentros"} subtitle={`${patient.sessions.length} registrados`} action={<ActionButton>Registrar encuentro</ActionButton>}>
                <form onSubmit={event => event.preventDefault ()} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field id={"filter-objective"} label={"Objetivo"}>
                        <select id="filter-objective" value={objective} onChange={e => setObjective (e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
                            <option value="">
                                Todos
                            </option>
                            {objectives.map (goal => (
                                <option key={goal} value={goal}>
                                    {goal}
                                </option>
                            ))}
                        </select>
                    </Field>
                    <Field id={"filter-query"} label={"Actividad u observación"}>
                        <input id="filter-query" type="search" value={query} onChange={e => setQuery (e.target.value)} placeholder="Buscar..." className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"/>
                    </Field>
                    <Field id={"filter-from"} label={"Desde"}>
                        <input id="filter-from" type="date" value={from} max={to || undefined} onChange={e => setFrom (e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"/>
                    </Field>
                    <Field id={"filter-to"} label={"Hasta"}>
                        <input id="fiter-to" type="date" value={to} min={from || undefined} onChange={e => setTo (e.target.value)} className="w-full rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"/>
                    </Field>
                </form>
                {hasFilters && (
                    <button type="button" onClick={clearFilters} className="mt-4 cursor-pointer text-sm font-medium text-primary hover:underline">
                        Limpiar filtros
                    </button>
                )}
            </CardPatientDetail>
            {filtered.length > 0 ? (
                <ul className="space-y-3">
                    {filtered.map (session => (
                        <li key={session.id}>
                            <details className="group rounded-xl border border-border bg-surface open:border-primary/30">
                                <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 [&::-webkit-details-marker]:hidden">
                                    <div className="flex items-center gap-4">
                                        <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-light text-center text-xs font-bold leading-tight text-primary">
                                            {formatDate (session.date, { day: "numeric", month: "short"})}
                                        </span>
                                        <div>
                                            <p className="font-semibold">
                                                {formatDate (session.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                            <p className="text-sm text-text-muted">
                                                {session.duration} min · {session.activities.length} {session.activities.length === 1 ? "actividad" : "actividades"}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-primary group-open:hidden">
                                        Ver detalle
                                    </span>
                                    <span className="hidden text-sm font-medium text-primary group-open:inline">
                                        Ocultar detalle
                                    </span>
                                </summary>
                                <div className="space-y-5 border-t border-border p-4 sm:p-5">
                                    <div>
                                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                            Objetivos trabajados
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {session.goals.map (goal => (
                                                <Pill key={goal}>
                                                    {goal}
                                                </Pill>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                            Actividades realizadas
                                        </h3>
                                        <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                                            {session.activities.map (activity => (
                                                <li key={activity}>
                                                    {activity}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                            Observaciones
                                        </h3>
                                        <p className="rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-text-secondary">
                                            {session.observations}
                                        </p>
                                    </div>
                                </div>
                            </details>
                        </li>
                    ))}
                </ul>
            ) : (
                <EmptyState title={"No hay encuentros con esos filtros"} text={"Probá con otro objetivo o periodo"}/>
            )}
        </div>
    )
}