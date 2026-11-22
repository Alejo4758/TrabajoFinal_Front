import { formatDate } from "../../utils/utils";

const textOf = (item) => (typeof item === "string" ? item : item?.text ?? "");

function List({ title, items }) {
  const clean = (items ?? []).map(textOf).filter(Boolean);
  if (clean.length === 0) return null;
  return (
    <div>
      {title && <h5 className="m-0 mb-1.5 text-sm font-semibold text-text">{title}</h5>}
      <ul className="m-0 list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-secondary">
        {clean.map((text, index) => <li key={`${index}-${text}`}>{text}</li>)}
      </ul>
    </div>
  );
}

export default function BoardPlan({ plan }) {
  if (!plan) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <h3 className="m-0 text-lg font-semibold">Todavía no hay un plan de trabajo</h3>
        <p className="mx-auto m-0 mt-2 max-w-lg text-sm text-text-secondary">
          Cuando el acompañante arme el plan, vas a poder consultarlo acá y dejar tus aportes.
        </p>
      </div>
    );
  }

  const stages = plan.stages ?? [];
  const validity = [plan.validFrom && formatDate(plan.validFrom), plan.validUntil && formatDate(plan.validUntil)].filter(Boolean);

  return (
    <article className="space-y-6 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <header className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="m-0 text-lg font-semibold">Plan de trabajo</h3>
        {validity.length === 2 && (
          <p className="m-0 text-sm text-text-muted">Vigente del {validity[0]} al {validity[1]}</p>
        )}
      </header>

      {plan.rationale?.trim() && (
        <section>
          <h4 className="m-0 mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">Por qué este plan</h4>
          <p className="m-0 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{plan.rationale}</p>
        </section>
      )}

      {(plan.generalGoals?.length > 0 || plan.areas?.length > 0) && (
        <section className="space-y-3">
          <h4 className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">Objetivos generales</h4>
          <List title="" items={plan.generalGoals} />
          {plan.areas?.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Áreas de intervención">
              {plan.areas.map((area) => (
                <li key={area} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{area}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {stages.map((stage) => (
        <section key={stage.id} className="space-y-3 rounded-lg border border-border bg-background p-4">
          <h4 className="m-0 text-base font-semibold">{stage.name || "Ámbito de trabajo"}</h4>
          {(stage.period || stage.frequency) && (
            <p className="m-0 text-sm text-text-muted">{[stage.period, stage.frequency].filter(Boolean).join(" · ")}</p>
          )}
          <List title="Objetivos específicos" items={stage.specificGoals} />
          <List title="Actividades propuestas" items={stage.activities} />
          <List title="Estrategias" items={stage.strategies} />
        </section>
      ))}

      {plan.familyTeam?.length > 0 && (
        <section>
          <List title="Trabajo con la familia y el equipo" items={plan.familyTeam} />
        </section>
      )}

      {plan.evaluation?.criteria?.length > 0 && (
        <section>
          <List title="Cómo se va a evaluar el avance" items={plan.evaluation.criteria} />
        </section>
      )}
    </article>
  );
}
