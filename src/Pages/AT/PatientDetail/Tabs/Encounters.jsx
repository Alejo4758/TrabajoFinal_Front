
import { useMemo, useRef, useState } from "react";
import { Link } from "react-router";

import { formatDate, normalize } from "../../../../utils/utils";
import { createSession } from "../../../../services/sessionService";

import SessionFormModal from "..//../../../components/AT/SessionFrom/SessionModal";
import { levelInfo } from "../../../../utils/scale";

function getSessionGoals(session) {
  // Compatibilidad con los registros anteriores durante la transición.
  return session.goals ?? session.goalEvaluations?.map((item) => ({
    goalId: item.goalId,
    goalText: item.goalText,
    level: item.level ?? item.rating,
    note: item.note ?? "",
  })) ?? [];
}

function goalText(item) {
  return item.goalText ?? "Objetivo sin descripción";
}

export default function Encounters({
  patient,
  sessions = [],
  onSessionsChange,
}) {
  const [objective, setObjective] = useState("");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");

  const registerRef = useRef(null);

  const stages = patient.plan?.stages ?? [];

  const canRegister = stages.some(
    (stage) => (stage.specificGoals ?? []).length > 0
  );

  const objectives = useMemo(() => {
    const planned = stages.flatMap((stage) =>
      (stage.specificGoals ?? []).map((goal) => ({
        id: goal.id,
        text: goal.text,
      }))
    );

    const historical = sessions.flatMap((session) =>
      getSessionGoals(session).map((goal) => ({
        id: goal.goalId,
        text: goalText(goal),
      }))
    );

    const unique = new Map();

    [...planned, ...historical].forEach((goal) => {
      if (goal.id && !unique.has(goal.id)) {
        unique.set(goal.id, goal);
      }
    });

    return [...unique.values()];
  }, [patient.plan, sessions]);

  const filtered = useMemo(() => {
    const term = normalize(query.trim());

    return [...sessions]
      .filter((session) => {
        const goals = getSessionGoals(session);

        if (
          objective &&
          !goals.some((goal) => goal.goalId === objective)
        ) {
          return false;
        }

        if (from && session.date < from) return false;
        if (to && session.date > to) return false;

        const searchable = [
          ...(session.activities ?? []),
          session.observations ?? "",
          ...goals.map(goalText),
          ...goals.map((goal) => goal.note ?? ""),
        ].join(" ");

        if (term && !normalize(searchable).includes(term)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        return dateComparison || String(b.id).localeCompare(String(a.id));
      });
  }, [sessions, objective, query, from, to]);

  const hasFilters = Boolean(objective || query || from || to);

  const clearFilters = () => {
    setObjective("");
    setQuery("");
    setFrom("");
    setTo("");
  };

  const closeForm = () => {
    setShowForm(false);

    // Devuelve el foco al botón que abrió el modal.
    window.setTimeout(() => registerRef.current?.focus(), 0);
  };

  const handleSave = async (data) => {
    const saved = await createSession(patient.id, data);

    const nextSessions = [...sessions, saved].sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    onSessionsChange?.(nextSessions);

    clearFilters();
    setNotice(
      `Encuentro del ${formatDate(saved.date)} registrado correctamente.`
    );

    return saved;
  };

  const registerButton = canRegister ? (
    <button
      ref={registerRef}
      type="button"
      onClick={() => {
        setNotice("");
        setShowForm(true);
      }}
      className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      Registrar encuentro
    </button>
  ) : null;

  const noticeBar = notice && (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"
    >
      <span>{notice}</span>
      <Link
        to="?tab=evolution"
        replace
        className="font-semibold text-primary hover:underline"
      >
        Ver evolución
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {noticeBar}

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <h3 className="text-lg font-semibold">
            Todavía no registraste encuentros
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
            {canRegister
              ? "Cada encuentro que registres quedará en el historial del paciente, con los objetivos trabajados, las actividades y tus observaciones."
              : "Para registrar encuentros, primero armá el plan de trabajo con al menos un objetivo específico."}
          </p>

          <div className="mt-5">
            {canRegister ? (
              registerButton
            ) : (
              <Link
                to="?tab=workPlan"
                replace
                className="inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Ir al plan de trabajo
              </Link>
            )}
          </div>
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">
                  Historial de encuentros
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  {sessions.length} registrados
                </p>
              </div>

              {registerButton}
            </div>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              aria-label="Filtrar encuentros"
            >
              <div>
                <label htmlFor="filter-objective" className="mb-1.5 block text-sm font-medium">
                  Objetivo
                </label>
                <select
                  id="filter-objective"
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                >
                  <option value="">Todos</option>
                  {objectives.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.text}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="filter-query" className="mb-1.5 block text-sm font-medium">
                  Actividad u observación
                </label>
                <input
                  id="filter-query"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar..."
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="filter-from" className="mb-1.5 block text-sm font-medium">
                  Desde
                </label>
                <input
                  id="filter-from"
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="filter-to" className="mb-1.5 block text-sm font-medium">
                  Hasta
                </label>
                <input
                  id="filter-to"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                />
              </div>
            </form>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}

            {!canRegister && (
              <p className="mt-4 text-sm text-text-muted">
                Para registrar nuevos encuentros hace falta un plan con objetivos.{" "}
                <Link
                  to="?tab=workPlan"
                  replace
                  className="font-medium text-primary hover:underline"
                >
                  Ir al plan
                </Link>
              </p>
            )}
          </section>

          <p className="text-sm text-text-muted" role="status">
            {filtered.length === 1
              ? "1 encuentro"
              : `${filtered.length} encuentros`}
          </p>

          {filtered.length > 0 ? (
            <ul className="space-y-3">
              {filtered.map((session) => {
                const goals = getSessionGoals(session);

                return (
                  <li key={session.id}>
                    <details className="group rounded-xl border border-border bg-surface open:border-primary/30">
                      <summary className="flex cursor-pointer list-none flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-4">
                          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-light text-center text-xs font-bold leading-tight text-primary">
                            {formatDate(session.date, {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>

                          <div>
                            <p className="font-semibold">
                              {formatDate(session.date, {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>

                            <p className="text-sm text-text-muted">
                              {session.duration} min ·{" "}
                              {(session.activities ?? []).length}{" "}
                              {(session.activities ?? []).length === 1
                                ? "actividad"
                                : "actividades"}
                              {session.stageName
                                ? ` · ${session.stageName}`
                                : ""}
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
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Objetivos trabajados
                          </h4>

                          <ul className="space-y-2">
                            {goals.map((goal) => {
                              const level = levelInfo(goal.level);

                              return (
                                <li
                                  key={goal.goalId}
                                  className="rounded-lg border border-border bg-background p-3 text-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {goalText(goal)}
                                    </span>

                                    {level && (
                                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                        {goal.level}/5 · {level.label}
                                      </span>
                                    )}
                                  </div>

                                  {goal.note && (
                                    <p className="mt-1.5 text-text-secondary">
                                      {goal.note}
                                    </p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        <div>
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Actividades realizadas
                          </h4>

                          <ul className="list-inside list-disc space-y-1 text-sm text-text-secondary">
                            {(session.activities ?? []).map((activity) => (
                              <li key={activity}>{activity}</li>
                            ))}
                          </ul>
                        </div>

                        {session.observations?.trim() && (
                          <div>
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                              Observaciones
                            </h4>
                            <p className="rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-text-secondary">
                              {session.observations}
                            </p>
                          </div>
                        )}
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-8 text-center">
              <h3 className="font-semibold">
                No hay encuentros con esos filtros
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Probá con otro objetivo, otro período o una búsqueda distinta.
              </p>
            </div>
          )}
        </>
      )}

      {showForm && (
        <SessionFormModal
          patient={patient}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
