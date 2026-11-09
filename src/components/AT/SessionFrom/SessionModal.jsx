
import { useEffect, useMemo, useRef, useState } from "react";
import RatingInput from "./RattingInput";
import { isValidLevel } from "../../../utils/scale";

const OBSERVATIONS_MAX = 600;
const NOTE_MAX = 200;
const ACTIVITY_MAX = 80;

function todayISO() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function createInitialForm() {
  return {
    date: todayISO(),
    duration: "60",
    stageId: "",
    ratings: {},
    activities: [],
    newActivity: "",
    observations: "",
  };
}

function FieldError({ id, message }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-600">
      {message}
    </p>
  );
}

export default function SessionFormModal({
  patient,
  onSave,
  onClose,
}) {
  const stages = useMemo(
    () =>
      (patient.plan?.stages ?? []).filter(
        (stage) => (stage.specificGoals ?? []).length > 0
      ),
    [patient.plan]
  );

  const [form, setForm] = useState(() => ({
    ...createInitialForm(),
    stageId: stages[0]?.id ?? "",
  }));

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dialogRef = useRef(null);
  const initialSnapshot = useRef("");

  const stage =
    stages.find((item) => item.id === form.stageId) ?? stages[0] ?? null;

  const goals = stage?.specificGoals ?? [];
  const activitiesFromPlan = stage?.activities ?? [];

  useEffect(() => {
    initialSnapshot.current = JSON.stringify({
      ...createInitialForm(),
      stageId: stages[0]?.id ?? "",
    });

    dialogRef.current?.focus();
  }, []);

  const dirty =
    // eslint-disable-next-line react-hooks/refs
    JSON.stringify(form) !== initialSnapshot.current;

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));

    setServerError("");
  };

  const clearError = (key) => {
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setServerError("");
  };

  const requestClose = () => {
    if (sending) return;

    if (dirty) {
      setConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }

      // Mantiene el foco dentro del diálogo.
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === last
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [dirty, sending]);

  const changeStage = (stageId) => {
    setForm((previous) => ({
      ...previous,
      stageId,
      ratings: {},
      activities: [],
    }));

    setErrors({});
    setServerError("");
  };

  const toggleGoal = (goal) => {
    setForm((previous) => {
      const nextRatings = { ...previous.ratings };

      if (nextRatings[goal.id]) {
        delete nextRatings[goal.id];
      } else {
        nextRatings[goal.id] = {
          level: null,
          note: "",
        };
      }

      return {
        ...previous,
        ratings: nextRatings,
      };
    });

    clearError("goals");
  };

  const updateGoalLevel = (goalId, level) => {
    setForm((previous) => ({
      ...previous,
      ratings: {
        ...previous.ratings,
        [goalId]: {
          ...previous.ratings[goalId],
          level,
        },
      },
    }));

    clearError(`level:${goalId}`);
  };

  const updateGoalNote = (goalId, note) => {
    setForm((previous) => ({
      ...previous,
      ratings: {
        ...previous.ratings,
        [goalId]: {
          ...previous.ratings[goalId],
          note,
        },
      },
    }));
  };

  const toggleActivity = (activity) => {
    setForm((previous) => ({
      ...previous,
      activities: previous.activities.includes(activity)
        ? previous.activities.filter((item) => item !== activity)
        : [...previous.activities, activity],
    }));

    clearError("activities");
  };

  const addActivity = () => {
    const clean = form.newActivity.trim();

    if (!clean) return;

    const exists = form.activities.some(
      (item) => item.toLowerCase() === clean.toLowerCase()
    );

    setForm((previous) => ({
      ...previous,
      activities: exists
        ? previous.activities
        : [...previous.activities, clean],
      newActivity: "",
    }));

    clearError("activities");
  };

  const validate = () => {
    const found = {};

    if (!form.date) {
      found.date = "Indicá la fecha del encuentro.";
    } else if (form.date > todayISO()) {
      found.date = "La fecha no puede ser futura.";
    }

    const duration = Number(form.duration);

    if (
      !form.duration ||
      !Number.isInteger(duration) ||
      duration < 5 ||
      duration > 480
    ) {
      found.duration = "Ingresá una duración entre 5 y 480 minutos.";
    }

    if (!stage) {
      found.stageId = "Seleccioná un ámbito con objetivos.";
    }

    const selectedGoalIds = Object.keys(form.ratings);

    if (!selectedGoalIds.length) {
      found.goals = "Marcá al menos un objetivo trabajado.";
    }

    selectedGoalIds.forEach((goalId) => {
      if (!isValidLevel(form.ratings[goalId]?.level)) {
        found[`level:${goalId}`] = "Elegí un nivel del 1 al 5.";
      }
    });

    if (!form.activities.length) {
      found.activities = "Seleccioná o agregá al menos una actividad.";
    }

    return found;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = validate();
    setErrors(found);

    if (Object.values(found).some(Boolean)) {
      const firstError = Object.keys(found).find((key) => found[key]);

      const targetId = firstError.startsWith("level:")
        ? `rating-${firstError.slice(6)}-1`
        : `session-${firstError}`;

      document.getElementById(targetId)?.focus();
      return;
    }

    setSending(true);
    setServerError("");

    try {
      const saved = await onSave({
        date: form.date,
        duration: Number(form.duration),
        stageId: stage.id,
        stageName: stage.name,

        goals: goals
          .filter((goal) => form.ratings[goal.id])
          .map((goal) => {
            const evaluation = form.ratings[goal.id];

            return {
              goalId: goal.id,
              goalText: goal.text,
              level: Number(evaluation.level),
              note: evaluation.note.trim(),
            };
          }),

        activities: [...form.activities],
        observations: form.observations.trim(),
      });

      onClose(saved);
    } catch (error) {
      setServerError(
        error.message || "No pudimos registrar el encuentro. Intentá nuevamente."
      );
    } finally {
      setSending(false);
    }
  };

  if (!stage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-modal-title"
          className="w-full max-w-md rounded-2xl bg-surface p-6 text-center shadow-2xl"
        >
          <h2 id="session-modal-title" className="text-xl font-bold">
            Primero armá el plan de trabajo
          </h2>

          <p className="mt-2 text-sm text-text-secondary">
            Para registrar un encuentro, el plan debe tener al menos un ámbito
            con objetivos específicos.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-modal-title"
        className="flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-3xl bg-surface shadow-2xl focus:outline-none sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            <h2 id="session-modal-title" className="text-xl font-bold">
              Registrar encuentro
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {patient.name}
            </p>
          </div>

          <button
            type="button"
            onClick={requestClose}
            disabled={sending}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-text-secondary hover:bg-background disabled:opacity-50"
          >
            ✕
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-7 overflow-y-auto p-5 sm:p-6">
            {serverError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="session-date" className="mb-1.5 block text-sm font-medium">
                  Fecha
                </label>
                <input
                  id="session-date"
                  type="date"
                  max={todayISO()}
                  value={form.date}
                  onChange={(event) => updateField("date", event.target.value)}
                  aria-invalid={Boolean(errors.date)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                />
                <FieldError message={errors.date} />
              </div>

              <div>
                <label htmlFor="session-duration" className="mb-1.5 block text-sm font-medium">
                  Duración (minutos)
                </label>
                <input
                  id="session-duration"
                  type="number"
                  min="5"
                  max="480"
                  step="5"
                  value={form.duration}
                  onChange={(event) => updateField("duration", event.target.value)}
                  aria-invalid={Boolean(errors.duration)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                />
                <FieldError message={errors.duration} />
              </div>

              {stages.length > 1 && (
                <div className="sm:col-span-2">
                  <label htmlFor="session-stage" className="mb-1.5 block text-sm font-medium">
                    Ámbito del encuentro
                  </label>
                  <select
                    id="session-stage"
                    value={stage.id}
                    onChange={(event) => changeStage(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                  >
                    {stages.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-text-muted">
                    Los objetivos y actividades corresponden al ámbito elegido.
                    Al cambiarlo, se reinician las selecciones anteriores.
                  </p>
                </div>
              )}
            </div>

            <section aria-labelledby="goals-title">
              <h3 id="goals-title" className="text-sm font-bold">
                Objetivos trabajados
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Marcá los objetivos que trabajaste y valorá el desempeño observado
                durante este encuentro.
              </p>

              <ul className="mt-4 space-y-3">
                {goals.map((goal) => {
                  const evaluation = form.ratings[goal.id];
                  const active = Boolean(evaluation);

                  return (
                    <li
                      key={goal.id}
                      className={`rounded-xl border p-4 ${
                        active
                          ? "border-primary/40 bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          id={!active && goals[0]?.id === goal.id ? "session-goals" : undefined}
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleGoal(goal)}
                          className="mt-0.5 size-5 shrink-0 accent-primary"
                        />
                        <span className="text-sm font-medium">{goal.text}</span>
                      </label>

                      {active && (
                        <div className="mt-4 space-y-3 pl-8">
                          <RatingInput
                            name={`rating-${goal.id}`}
                            legend={`Nivel observado: ${goal.text}`}
                            value={evaluation.level}
                            onChange={(level) => updateGoalLevel(goal.id, level)}
                            error={errors[`level:${goal.id}`]}
                          />

                          <input
                            type="text"
                            value={evaluation.note}
                            maxLength={NOTE_MAX}
                            onChange={(event) => updateGoalNote(goal.id, event.target.value)}
                            placeholder="Nota sobre este objetivo (opcional)"
                            aria-label={`Nota sobre: ${goal.text}`}
                            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <FieldError message={errors.goals} />
            </section>

            <section aria-labelledby="activities-title">
              <h3 id="activities-title" className="text-sm font-bold">
                Actividades realizadas
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                Elegí las actividades del plan o agregá otras que hayas realizado.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {activitiesFromPlan.map((activity) => {
                  const selected = form.activities.includes(activity);

                  return (
                    <button
                      key={activity}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleActivity(activity)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm font-medium ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-text"
                      }`}
                    >
                      {selected ? "✓ " : ""}
                      {activity}
                    </button>
                  );
                })}

                {form.activities
                  .filter((activity) => !activitiesFromPlan.includes(activity))
                  .map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      aria-pressed="true"
                      onClick={() => toggleActivity(activity)}
                      className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm font-medium text-primary"
                    >
                      ✓ {activity}
                    </button>
                  ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={form.newActivity}
                  maxLength={ACTIVITY_MAX}
                  onChange={(event) => updateField("newActivity", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addActivity();
                    }
                  }}
                  placeholder="Otra actividad..."
                  aria-label="Agregar otra actividad"
                  className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
                />

                <button
                  type="button"
                  onClick={addActivity}
                  className="rounded-lg border border-border px-4 text-sm font-semibold hover:bg-background"
                >
                  Agregar
                </button>
              </div>

              <FieldError message={errors.activities} />
            </section>

            <section>
              <label htmlFor="session-observations" className="mb-1.5 block text-sm font-medium">
                Observaciones (opcional)
              </label>
              <textarea
                id="session-observations"
                rows={4}
                maxLength={OBSERVATIONS_MAX}
                value={form.observations}
                onChange={(event) => updateField("observations", event.target.value)}
                placeholder="¿Cómo fue el encuentro? ¿Algo para tener en cuenta?"
                className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2.5 text-sm"
              />
              <p className="mt-1.5 text-right text-xs text-text-muted">
                {form.observations.length}/{OBSERVATIONS_MAX}
              </p>
            </section>
          </div>

          {confirmDiscard && (
            <div
              role="alertdialog"
              aria-label="Datos sin guardar"
              className="mx-5 mb-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-6"
            >
              <p className="font-semibold">Hay datos sin guardar.</p>
              <p className="mt-1">Si cerrás ahora, se pierde lo que cargaste.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDiscard(false)}
                  className="rounded-lg border border-amber-400 bg-surface px-4 py-2 text-sm font-semibold"
                >
                  Seguir editando
                </button>
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="rounded-lg border border-amber-400 bg-surface px-4 py-2 text-sm font-semibold"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5">
            <button
              type="button"
              onClick={requestClose}
              disabled={sending}
              className="rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-background disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
            >
              {sending ? "Guardando..." : "Guardar encuentro"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
