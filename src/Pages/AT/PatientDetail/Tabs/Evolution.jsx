
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatDate } from "../../../../utils/utils";
import { compareSessions } from "../../../../services/sessionService";

const LINE_COLORS = [
  "#2563eb",
  "#0f766e",
  "#9333ea",
  "#d97706",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#ea580c",
];

function getSessionGoals(session) {
  return (
    session.goals ??
    session.goalEvaluations?.map((item) => ({
      goalId: item.goalId,
      goalText: item.goalText,
      level: item.level ?? item.rating,
      note: item.note ?? "",
    })) ??
    []
  );
}

function getObjectives(patient, sessions) {
  const planned = (patient.plan?.stages ?? []).flatMap((stage) =>
    (stage.specificGoals ?? []).map((goal) => ({
      id: goal.id,
      text: goal.text,
    }))
  );

  const historical = sessions.flatMap((session) =>
    getSessionGoals(session).map((goal) => ({
      id: goal.goalId,
      text: goal.goalText,
    }))
  );

  const unique = new Map();

  [...planned, ...historical].forEach((goal) => {
    if (goal.id && !unique.has(goal.id)) {
      unique.set(goal.id, goal);
    }
  });

  return [...unique.values()];
}

function getDateLabel(date) {
  return formatDate(date, {
    day: "numeric",
    month: "short",
  });
}

function getValidLevel(value) {
  const level = Number(value);

  return Number.isInteger(level) && level >= 1 && level <= 5
    ? level
    : null;
}

export default function Evolution({ patient, sessions = [] }) {
  const objectives = useMemo(
    () => getObjectives(patient, sessions),
    [patient.plan, sessions]
  );

  const records = useMemo(() => {
    // Del más antiguo al más reciente, por fecha y hora
    const ordered = [...sessions].sort(compareSessions);

    // Los días con más de un encuentro muestran la hora en el eje, para distinguir los puntos
    const encountersPerDate = {};
    ordered.forEach((session) => {
      encountersPerDate[session.date] =
        (encountersPerDate[session.date] ?? 0) + 1;
    });

    return ordered.map((session) => {
      const goals = getSessionGoals(session);
      const values = {};

      objectives.forEach((objective) => {
        const evaluation = goals.find(
          (goal) => goal.goalId === objective.id
        );

        values[`goal_${objective.id}`] = getValidLevel(
          evaluation?.level
        );
      });

      const dateLabel = getDateLabel(session.date);
      const sharesDate = encountersPerDate[session.date] > 1;

      return {
        id: session.id,
        date: session.date,
        time: session.time ?? null,
        label: sharesDate && session.time ? `${dateLabel} ${session.time}` : dateLabel,
        ...values,
      };
    });
  }, [sessions, objectives]);

  const evaluations = useMemo(() => {
    return objectives.map((objective) => {
      const key = `goal_${objective.id}`;

      const history = records
        .filter((record) => record[key] != null)
        .map((record) => ({
          date: record.date,
          time: record.time,
          label: record.label,
          value: record[key],
        }));

      const latest = history[history.length - 1] ?? null;

      return {
        ...objective,
        history,
        latest,
        count: history.length,
      };
    });
  }, [objectives, records]);

  const totalEvaluations = evaluations.reduce(
    (total, objective) => total + objective.count,
    0
  );

  const average =
    totalEvaluations > 0
      ? (
          evaluations.reduce(
            (total, objective) =>
              total +
              objective.history.reduce(
                (sum, item) => sum + item.value,
                0
              ),
            0
          ) / totalEvaluations
        ).toFixed(1)
      : null;

  // Por defecto se muestra el primer objetivo que tenga valoraciones.
  const [selectedObjectives, setSelectedObjectives] = useState(null);

  const objectivesWithData = evaluations.filter(
    (objective) => objective.count > 0
  );

  const visibleObjectives = selectedObjectives === null
    ? objectivesWithData.slice(0, 1)
    : objectivesWithData.filter((objective) =>
        selectedObjectives.includes(objective.id)
      );

  function toggleObjective(objectiveId) {
    setSelectedObjectives((previous) => {
      // Si todavía no hubo una selección manual,
      // partimos del objetivo que se muestra inicialmente.
      const current =
        previous === null
          ? visibleObjectives.map((objective) => objective.id)
          : previous;

      if (current.includes(objectiveId)) {
        return current.filter((id) => id !== objectiveId);
      }

      return [...current, objectiveId];
    });
  }

  function selectAllObjectives() {
    setSelectedObjectives(objectivesWithData.map((objective) => objective.id));
  }

  function clearObjectives() {
    setSelectedObjectives([]);
  }

  if (sessions.length === 0 || totalEvaluations === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <h3 className="text-lg font-semibold">
          Todavía no hay datos de evolución
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-sm text-text-secondary">
          Cuando registres encuentros y valores los objetivos trabajados,
          vas a poder consultar acá cómo fue el desempeño observado en cada uno.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ESTADÍSTICAS */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">
            Encuentros registrados
          </p>
          <p className="mt-2 text-2xl font-bold">{sessions.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">
            Valoraciones realizadas
          </p>
          <p className="mt-2 text-2xl font-bold">
            {totalEvaluations}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-muted">
            Promedio de valoraciones
          </p>
          <p className="mt-2 text-2xl font-bold">
            {average ? `${average}/5` : "—"}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Promedio descriptivo de los registros disponibles.
          </p>
        </div>
      </section>

      {/* GRÁFICO */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold">
            Desempeño observado por encuentro
          </h3>

          <p className="mt-1 text-sm text-text-secondary">
            Elegí los objetivos que querés visualizar. Podés seleccionar
            uno o varios para comparar sus valoraciones.
          </p>
        </div>

        {/* SELECTOR DE OBJETIVOS */}
        <div className="mb-6 rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">
              Objetivos a visualizar
            </p>

            <div className="flex gap-3 text-xs">
              <button
                type="button"
                onClick={selectAllObjectives}
                className="font-medium text-primary hover:underline"
              >
                Seleccionar todos
              </button>

              <button
                type="button"
                onClick={clearObjectives}
                className="font-medium text-text-secondary hover:text-text"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {objectivesWithData.map((objective) => {
              const index = objectives.findIndex(
                (item) => item.id === objective.id
              );

              const color = LINE_COLORS[index % LINE_COLORS.length];

              const isSelected = visibleObjectives.some(
                (item) => item.id === objective.id
              );

              return (
                <button
                  key={objective.id}
                  type="button"
                  onClick={() => toggleObjective(objective.id)}
                  aria-pressed={isSelected}
                  className={`
                    inline-flex max-w-full items-center gap-2 rounded-full
                    border px-3 py-2 text-sm transition
                    ${
                      isSelected
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border bg-surface text-text-secondary hover:border-primary"
                    }
                  `}
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: isSelected ? color : "transparent",
                      border: `2px solid ${color}`,
                    }}
                  />

                  <span className="truncate">{objective.text}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-text-muted">
            {visibleObjectives.length} de {objectivesWithData.length}{" "}
            {objectivesWithData.length === 1
              ? "objetivo seleccionado"
              : "objetivos seleccionados"}
          </p>
        </div>

        {/* ÁREA DEL GRÁFICO */}
        {visibleObjectives.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border px-4 text-center">
            <p className="font-medium">
              No hay objetivos seleccionados
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Seleccioná al menos un objetivo para visualizar su evolución.
            </p>
          </div>
        ) : (
          <>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={records}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 0,
                    bottom: 10,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    minTickGap={20}
                  />

                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    allowDecimals={false}
                    width={35}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      value == null ? "Sin valoración" : `${value}/5`,
                      name,
                    ]}
                    labelFormatter={(_, payload) => {
                      const record = payload?.[0]?.payload;

                      if (!record) return "";

                      const day = formatDate(record.date, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });

                      return record.time ? `${day}, ${record.time} h` : day;
                    }}
                  />

                  <Legend />

                  {visibleObjectives.map((objective) => {
                    const index = objectives.findIndex(
                      (item) => item.id === objective.id
                    );

                    return (
                      <Line
                        key={objective.id}
                        type="linear"
                        dataKey={`goal_${objective.id}`}
                        name={objective.text}
                        stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{
                          r: 5,
                          strokeWidth: 2,
                          fill: "#ffffff",
                        }}
                        activeDot={{
                          r: 7,
                          strokeWidth: 2,
                        }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {visibleObjectives.map((objective) => {
                const index = objectives.findIndex(
                  (item) => item.id === objective.id
                );

                return (
                  <div
                    key={objective.id}
                    className="flex min-w-0 items-center gap-2 text-xs text-text-secondary"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          LINE_COLORS[index % LINE_COLORS.length],
                      }}
                    />
                    <span className="break-words">{objective.text}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="mt-4 text-xs text-text-muted">
          Escala de 1 a 5. Un valor más alto indica mayor autonomía observada
          durante ese encuentro, según la escala provisional.
        </p>
      </section>

      {/* HISTORIAL POR OBJETIVO */}
      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h3 className="text-lg font-semibold">
          Historial por objetivo
        </h3>

        <p className="mt-1 text-sm text-text-secondary">
          Última valoración registrada y cantidad de encuentros en los que
          se evaluó cada objetivo.
        </p>

        <ul className="mt-4 space-y-3">
          {evaluations.map((objective) => (
            <li
              key={objective.id}
              className="rounded-xl border border-border bg-background p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-medium">{objective.text}</p>

                <span className="text-sm text-text-muted">
                  {objective.count}{" "}
                  {objective.count === 1
                    ? "valoración"
                    : "valoraciones"}
                </span>
              </div>

              {objective.latest ? (
                <p className="mt-2 text-sm text-text-secondary">
                  Último desempeño observado:{" "}
                  <strong className="text-text">
                    {objective.latest.value}/5
                  </strong>
                  {" · "}
                  {formatDate(objective.latest.date, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {objective.latest.time && `, ${objective.latest.time} h`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-text-muted">
                  Este objetivo todavía no fue valorado en ningún encuentro.
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
