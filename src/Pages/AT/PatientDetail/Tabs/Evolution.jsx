import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { ActionButton } from "../../../../components/AT/ActionButton/ActionButton";
import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import { formatDate } from "../../../../utils/utils";
import { THRESHOLDS, COLORS } from "../../../../utils/constants";
import EmptyState from "../../../../components/AT/EmptyState/EmptyState";
import Pill from "../../../../components/AT/Pill/Pill";

function toTime(date) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function timeToISO(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getLevel(value) {
  if (value >= THRESHOLDS.achieved) {
    return { label: "Logrado", tone: "success" };
  }

  if (value >= THRESHOLDS.inProgress) {
    return { label: "En proceso", tone: "primary" };
  }

  return { label: "Inicial", tone: "neutral" };
}

function EvolutionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const values = payload.filter(
    (item) => item.value !== null && item.value !== undefined
  );

  if (!values.length) return null;

  return (
  <div className="min-w-48 rounded-xl border border-border bg-surface p-3 shadow-lg">
      <p className="mb-3 text-xs font-semibold text-text-muted">
        {formatDate(timeToISO(Number(label)), {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="space-y-2">
        {values.map((item) => (
          <div
            key={item.dataKey}
            className="flex items-start justify-between gap-4"
          >
            <span className="max-w-48 text-xs text-text-secondary">
              {item.name}
            </span>

            <span
              className="shrink-0 text-sm font-bold"
              style={{ color: item.color }}
            >
              {item.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Evolution({ patient }) {
  const [hidden, setHidden] = useState([]);

  // Preparamos los objetivos y sus registros.
  const series = useMemo(() => {
    return patient.objectives.map((objective, index) => {
      const history = [...(objective.history ?? [])]
        .filter(
          (item) =>
            /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
            Number.isFinite(item.value) &&
            item.value >= 0 &&
            item.value <= 100
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        ...objective,
        history,
        key: `objective_${objective.id}`,
        color: COLORS[index % COLORS.length],
        current: history.at(-1) ?? null,
        first: history[0] ?? null,
      };
    });
  }, [patient.objectives]);

  // Unificamos todas las fechas sin crear evaluaciones ficticias.
  const chartData = useMemo(() => {
    const dates = [
      ...new Set(
        series.flatMap((item) =>
          item.history.map((record) => record.date)
        )
      ),
    ].sort();

    return dates.map((date) => {
      const row = {
        date,
        timestamp: toTime(date),
      };

      series.forEach((item) => {
        const record = item.history.find(
          (entry) => entry.date === date
        );

        row[item.key] = record ? record.value : null;
      });

      return row;
    });
  }, [series]);

  const visible = series.filter(
    (item) => !hidden.includes(item.id)
  );

  const evaluated = series.filter((item) => item.current);

  const counts = {
    done: evaluated.filter(
      (item) => item.current.value >= THRESHOLDS.achieved
    ).length,

    inProgress: evaluated.filter(
      (item) =>
        item.current.value >= THRESHOLDS.inProgress &&
        item.current.value < THRESHOLDS.achieved
    ).length,

    initial: evaluated.filter(
      (item) => item.current.value < THRESHOLDS.inProgress
    ).length,
  };

  const toggle = (id) => {
    setHidden((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  if (series.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay objetivos para seguir"
        text="Cuando armes el plan de trabajo y registres evaluaciones, vas a poder visualizar acá la evolución de cada objetivo."
      >
        <ActionButton>
          Registrar evolución
        </ActionButton>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">

      {/* Indicadores generales */}
      <dl className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <dt className="text-sm text-text-secondary">
            Logrados
          </dt>
          <dd className="mt-1 text-3xl font-bold text-success">
            {counts.done}
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <dt className="text-sm text-text-secondary">
            En proceso
          </dt>
          <dd className="mt-1 text-3xl font-bold">
            {counts.inProgress}
          </dd>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <dt className="text-sm text-text-secondary">
            Iniciales
          </dt>
          <dd className="mt-1 text-3xl font-bold">
            {counts.initial}
          </dd>
        </div>

      </dl>

      {/* Gráfico */}
      <CardPatientDetail
        title="Evolución en el tiempo"
        subtitle="Seguimiento del progreso de los objetivos"
        action={
          <ActionButton>
            Registrar evolución
          </ActionButton>
        }
      >

        {/* Selector de objetivos */}
        <ul className="mb-5 flex flex-wrap gap-2">
          {series.map((item) => {
            const isHidden = hidden.includes(item.id);

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={!isHidden}
                  className={`flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition ${
                    isHidden
                      ? "border-border text-text-muted"
                      : "border-border bg-surface-alt text-text"
                  }`}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: isHidden
                        ? "#94a3b8"
                        : item.color,
                    }}
                  />

                  <span className={isHidden ? "line-through" : ""}>
                    {item.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Gráfico responsive */}
        {chartData.length > 0 && visible.some(
          (item) => item.history.length > 0
        ) ? (
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 12,
                  right: 12,
                  bottom: 8,
                  left: 0,
                }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />

                <XAxis
                  type="number"
                  dataKey="timestamp"
                  scale="time"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(value) =>
                    formatDate(timeToISO(Number(value)), {
                      day: "numeric",
                      month: "short",
                    })
                  }
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={25}
                />

                <YAxis
                  type="number"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  width={42}
                  allowDataOverflow
                />

                <Tooltip
                  content={<EvolutionTooltip />}
                  cursor={{
                    stroke: "#94a3b8",
                    strokeDasharray: "4 4",
                  }}
                />

                <ReferenceLine
                  y={THRESHOLDS.achieved}
                  stroke="#16a34a"
                  strokeDasharray="5 5"
                  strokeOpacity={0.6}
                />

                <ReferenceLine
                  y={THRESHOLDS.inProgress}
                  stroke="#d97706"
                  strokeDasharray="5 5"
                  strokeOpacity={0.5}
                />

                {visible.map((item) =>
                  item.history.length > 0 ? (
                    <Line
                      key={item.id}
                      type="linear"
                      dataKey={item.key}
                      name={item.title}
                      stroke={item.color}
                      strokeWidth={2.5}
                      connectNulls
                      dot={{
                        r: 4,
                        fill: item.color,
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      }}
                      isAnimationActive={false}
                    />
                  ) : null
                )}

              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-medium">
              No hay evaluaciones para mostrar
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Seleccioná un objetivo con registros o registrá una nueva evaluación.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-muted">
          <span>
            <span className="mr-2 inline-block size-2 rounded-full bg-success" />
            Umbral de logro: 75%
          </span>
          <span>
            <span className="mr-2 inline-block size-2 rounded-full bg-amber-600" />
            Umbral de progreso: 25%
          </span>
        </div>

      </CardPatientDetail>

      {/* Estado actual por objetivo */}
      <CardPatientDetail
        title="Estado actual por objetivo"
        subtitle="Última evaluación registrada"
      >
        <ul>
          {series.map((item) => {
            const current = item.current;

            if (!current) {
              return (
                <li
                  key={item.id}
                  className="border-b border-border py-4 last:border-0"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    Sin evaluaciones registradas
                  </p>
                </li>
              );
            }

            const level = getLevel(current.value);
            const delta = current.value - item.first.value;

            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 border-b border-border py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 gap-3">
                  <span
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />

                  <div className="min-w-0">
                    <p className="font-semibold">
                      {item.title}
                    </p>

                    {item.note && (
                      <p className="mt-1 text-sm text-text-secondary">
                        {item.note}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-text-muted">
                      Último registro: {formatDate(current.date)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-2xl font-bold">
                    {current.value}%
                  </span>

                  <Pill tone={level.tone}>
                    {level.label}
                  </Pill>

                  <span className="text-xs text-text-muted">
                    {delta >= 0 ? "+" : ""}{delta} pts desde el inicio
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardPatientDetail>

    </div>
  );
}
