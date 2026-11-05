import { Field, PillToggle, controlClass } from './planUi';
import { PlanDocumentContent } from './PlanDocument';
import { AREAS, FREQUENCIES, SETTINGS, SUGGESTIONS, newStage } from '../../../utils/planModel';
import ListEditor from './ListEditor';

function FieldError ({ id, message }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-600">{message}</p>;
}

const errorClass = error => (error ? "border-red-600" : "");

export function DataStep ({ plan, setPlan, errors, patient, authorName }) {
  const toggleSetting = (value) =>
    setPlan({ ...plan, settings: plan.settings.includes(value) ? plan.settings.filter((s) => s !== value) : [...plan.settings, value] });

  return (
    <div className="space-y-7">
      <dl className="grid gap-4 rounded-xl border border-border bg-background p-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Paciente</dt><dd className="m-0 mt-1">{patient.name}{patient.age ? `, ${patient.age} años` : ''}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Acompañante</dt><dd className="m-0 mt-1">{authorName}</dd></div>
        <div><dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Estado</dt><dd className="m-0 mt-1">{plan.status === 'active' ? 'Vigente' : 'Borrador'}</dd></div>
      </dl>

      <fieldset aria-describedby={errors.settings ? 'plan-settings-error' : undefined}>
        <legend className="text-sm font-semibold">Modalidad de trabajo</legend>
        <p className="m-0 mt-1 text-sm text-text-muted">Elegí dónde se desarrolla el acompañamiento. Después vas a armar un ámbito por cada una.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {SETTINGS.map((setting, index) => {
            const on = plan.settings.includes(setting.value);
            return (
              <label key={setting.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${on ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                <input id={index === 0 ? 'plan-settings' : undefined} type="checkbox" checked={on} onChange={() => toggleSetting(setting.value)} className="mt-0.5 size-5 shrink-0 accent-primary" />
                <span>
                  <span className="block text-sm font-medium">{setting.label}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">{setting.hint}</span>
                </span>
              </label>
            );
          })}
        </div>
        <FieldError id="plan-settings-error" message={errors.settings} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Field id="plan-diagnosis" label="Diagnóstico (opcional)">
            <input id="plan-diagnosis" type="text" maxLength={200} value={plan.diagnosis} onChange={(e) => setPlan({ ...plan, diagnosis: e.target.value })} placeholder="Ej.: Trastorno del Desarrollo del Lenguaje" className={controlClass} />
          </Field>
          <p className="m-0 mt-1.5 text-xs text-text-muted">Es información sensible: completala solo si hace falta para el plan.</p>
        </div>
        <Field id="plan-weeklyHours" label="Carga horaria (opcional)">
          <input id="plan-weeklyHours" type="text" maxLength={120} value={plan.weeklyHours} onChange={(e) => setPlan({ ...plan, weeklyHours: e.target.value })} placeholder="Ej.: 5 horas semanales en el ámbito escolar" className={controlClass} />
        </Field>
        <div>
          <Field id="plan-validFrom" label="Vigente desde">
            <input id="plan-validFrom" type="date" value={plan.validFrom} onChange={(e) => setPlan({ ...plan, validFrom: e.target.value })} aria-invalid={Boolean(errors.validFrom)} aria-describedby={errors.validFrom ? 'plan-validFrom-error' : undefined} className={`${controlClass} ${errorClass(errors.validFrom)}`} />
          </Field>
          <FieldError id="plan-validFrom-error" message={errors.validFrom} />
        </div>
        <div>
          <Field id="plan-validUntil" label="Vigente hasta">
            <input id="plan-validUntil" type="date" value={plan.validUntil} min={plan.validFrom || undefined} onChange={(e) => setPlan({ ...plan, validUntil: e.target.value })} aria-invalid={Boolean(errors.validUntil)} aria-describedby={errors.validUntil ? 'plan-validUntil-error' : undefined} className={`${controlClass} ${errorClass(errors.validUntil)}`} />
          </Field>
          <FieldError id="plan-validUntil-error" message={errors.validUntil} />
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. Fundamentación ---------- */
const RATIONALE_MAX = 1500;

export function RationaleStep({ plan, setPlan, errors }) {
  return (
    <div className="space-y-4">
      <div>
        <Field id="plan-rationale" label="Fundamentación del plan">
          <textarea
            id="plan-rationale"
            rows={9}
            maxLength={RATIONALE_MAX}
            value={plan.rationale}
            onChange={(e) => setPlan({ ...plan, rationale: e.target.value })}
            aria-invalid={Boolean(errors.rationale)}
            aria-describedby={errors.rationale ? 'plan-rationale-error' : 'plan-rationale-help'}
            className={`${controlClass} resize-y ${errorClass(errors.rationale)}`}
          />
        </Field>
        <div className="mt-1.5 flex justify-between gap-3">
          <div className="min-w-0 flex-1">
            {errors.rationale ? <FieldError id="plan-rationale-error" message={errors.rationale} /> : (
              <p id="plan-rationale-help" className="m-0 text-sm text-text-muted">Contá el punto de partida, lo trabajado hasta ahora y el propósito del plan.</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-text-muted">{plan.rationale.length}/{RATIONALE_MAX}</span>
        </div>
      </div>

      <details className="rounded-xl border border-border bg-background p-4">
        <summary className="cursor-pointer text-sm font-medium text-primary">Ver un ejemplo de cómo redactarla</summary>
        <p className="m-0 mt-3 text-sm italic leading-relaxed text-text-secondary">
          «Durante los primeros meses de acompañamiento se trabajó la permanencia en el aula, el compartir con pares y la tolerancia a la
          frustración. Dado que estos procesos requieren continuidad, el plan propone sostener lo trabajado y profundizarlo, en articulación
          con la familia y el equipo escolar.»
        </p>
      </details>
    </div>
  );
}

/* ---------- 3. Objetivos generales y áreas ---------- */
export function GoalsStep({ plan, setPlan, errors }) {
  const toggleArea = (area) =>
    setPlan({ ...plan, areas: plan.areas.includes(area) ? plan.areas.filter((a) => a !== area) : [...plan.areas, area] });

  return (
    <div className="space-y-8">
      <ListEditor
        id="plan-generalGoals"
        label="Objetivos generales"
        hint="Lo que el acompañamiento busca lograr en términos amplios. Los objetivos más concretos se definen después, por ámbito."
        items={plan.generalGoals}
        onChange={(generalGoals) => setPlan({ ...plan, generalGoals })}
        suggestions={SUGGESTIONS.generalGoals}
        error={errors.generalGoals}
      />

      <fieldset>
        <legend className="text-sm font-semibold">Áreas de intervención (opcional)</legend>
        <p className="m-0 mt-1 text-sm text-text-muted">Elegí las áreas sobre las que se va a trabajar.</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Áreas de intervención">
          {AREAS.map((area) => (
            <PillToggle key={area} on={plan.areas.includes(area)} onClick={() => toggleArea(area)}>{area}</PillToggle>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

/* ---------- 4. Ámbitos de trabajo ---------- */
function StageEditor({ stage, index, onChange, onRemove, errors, canRemove }) {
  const set = (patch) => onChange({ ...stage, ...patch });
  const key = (field) => errors[`stage:${stage.id}:${field}`];
  const suggestions = (type) => SUGGESTIONS[type][stage.setting] ?? [];

  return (
    <li className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="m-0 text-base font-bold">Ámbito {index + 1}</h3>
        {canRemove && (
          <button type="button" onClick={onRemove} className="cursor-pointer text-sm font-medium text-red-600 hover:underline focus:outline-none focus:underline">
            Quitar ámbito
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Field id={`stage-${stage.id}-name`} label="Nombre">
            <input id={`stage-${stage.id}-name`} type="text" maxLength={80} value={stage.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={Boolean(key('name'))} aria-describedby={key('name') ? `stage-${stage.id}-name-error` : undefined} className={`${controlClass} ${errorClass(key('name'))}`} />
          </Field>
          <FieldError id={`stage-${stage.id}-name-error`} message={key('name')} />
        </div>
        <Field id={`stage-${stage.id}-setting`} label="Dónde se desarrolla">
          <select id={`stage-${stage.id}-setting`} value={stage.setting} onChange={(e) => set({ setting: e.target.value })} className={controlClass}>
            {SETTINGS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        <Field id={`stage-${stage.id}-period`} label="Período (opcional)">
          <input id={`stage-${stage.id}-period`} type="text" maxLength={80} value={stage.period} onChange={(e) => set({ period: e.target.value })} placeholder="Ej.: diciembre a febrero" className={controlClass} />
        </Field>
        <Field id={`stage-${stage.id}-frequency`} label="Frecuencia (opcional)">
          <input id={`stage-${stage.id}-frequency`} type="text" maxLength={80} value={stage.frequency} onChange={(e) => set({ frequency: e.target.value })} placeholder="Ej.: 5 horas semanales" className={controlClass} />
        </Field>
      </div>

      <div className="mt-6 space-y-7">
        <ListEditor id={`stage-${stage.id}-goals`} label="Objetivos específicos" hint="Objetivos concretos de este ámbito. Son los que después vas a poder marcar al registrar cada encuentro." items={stage.specificGoals} onChange={(specificGoals) => set({ specificGoals })} suggestions={suggestions('specificGoals')} error={key('goals')} />
        <ListEditor id={`stage-${stage.id}-activities`} label="Actividades propuestas" items={stage.activities} onChange={(activities) => set({ activities })} suggestions={suggestions('activities')} error={key('work')} />
        <ListEditor id={`stage-${stage.id}-strategies`} label="Estrategias" items={stage.strategies} onChange={(strategies) => set({ strategies })} suggestions={suggestions('strategies')} />
      </div>
    </li>
  );
}

export function StagesStep({ plan, setPlan, errors }) {
  const updateStage = (stage) => setPlan({ ...plan, stages: plan.stages.map((s) => (s.id === stage.id ? stage : s)) });
  const removeStage = (id) => setPlan({ ...plan, stages: plan.stages.filter((s) => s.id !== id) });
  const addStage = () => setPlan({ ...plan, stages: [...plan.stages, newStage(plan.settings[0] ?? 'home')] });

  return (
    <div className="space-y-5">
      <p className="m-0 text-sm text-text-muted">
        Cada ámbito tiene sus propios objetivos específicos, actividades y estrategias. Por ejemplo: una etapa de verano en el hogar y otra escolar.
      </p>

      <ul className="space-y-5">
        {plan.stages.map((stage, index) => (
          <StageEditor key={stage.id} stage={stage} index={index} errors={errors} canRemove={plan.stages.length > 1} onChange={updateStage} onRemove={() => removeStage(stage.id)} />
        ))}
      </ul>

      <FieldError id="plan-stages-error" message={errors.stages} />

      {plan.stages.length < 6 && (
        <button id="plan-add-stage" type="button" onClick={addStage} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-border py-4 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30">
          + Agregar otro ámbito
        </button>
      )}
    </div>
  );
}

/* ---------- 5. Familia y equipo ---------- */
export function FamilyStep({ plan, setPlan }) {
  return (
    <ListEditor
      id="plan-familyTeam"
      label="Trabajo con la familia y el equipo (opcional)"
      hint="Entrevistas, reuniones con la escuela y articulación con otros profesionales."
      items={plan.familyTeam}
      onChange={(familyTeam) => setPlan({ ...plan, familyTeam })}
      suggestions={SUGGESTIONS.familyTeam}
    />
  );
}

/* ---------- 6. Evaluación y seguimiento ---------- */
export function EvaluationStep({ plan, setPlan, errors }) {
  const setEvaluation = (patch) => setPlan({ ...plan, evaluation: { ...plan.evaluation, ...patch } });

  return (
    <div className="space-y-8">
      <ListEditor
        id="plan-criteria"
        label="Criterios de evaluación"
        hint="Qué aspectos se van a observar para evaluar los avances."
        items={plan.evaluation.criteria}
        onChange={(criteria) => setEvaluation({ criteria })}
        suggestions={SUGGESTIONS.criteria}
        error={errors.criteria}
      />

      <div>
        <Field id="plan-reportsFrequency" label="Informes de evolución">
          <select id="plan-reportsFrequency" value={plan.evaluation.reportsFrequency} onChange={(e) => setEvaluation({ reportsFrequency: e.target.value })} aria-invalid={Boolean(errors.reportsFrequency)} aria-describedby={errors.reportsFrequency ? 'plan-reportsFrequency-error' : undefined} className={`${controlClass} sm:max-w-xs ${errorClass(errors.reportsFrequency)}`}>
            <option value="">Elegí una opción</option>
            {FREQUENCIES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </Field>
        <FieldError id="plan-reportsFrequency-error" message={errors.reportsFrequency} />
      </div>

      <Field id="plan-evaluation-notes" label="Observaciones sobre la evaluación (opcional)">
        <textarea id="plan-evaluation-notes" rows={3} maxLength={600} value={plan.evaluation.notes} onChange={(e) => setEvaluation({ notes: e.target.value })} placeholder="Por ejemplo: el plan se revisa y ajusta según la respuesta del paciente." className={`${controlClass} resize-y`} />
      </Field>

      <Field id="plan-atRole" label="Rol del acompañante (opcional)">
        <textarea id="plan-atRole" rows={3} maxLength={800} value={plan.atRole} onChange={(e) => setPlan({ ...plan, atRole: e.target.value })} placeholder="Describí cómo se entiende el rol del acompañante en este proceso." className={`${controlClass} resize-y`} />
      </Field>
    </div>
  );
}

/* ---------- 7. Revisión ---------- */
export function ReviewStep({ plan, patient, authorName, problems, steps, goTo }) {
  const pending = steps.filter((step) => problems[step.id]);

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="m-0 font-semibold">Todavía falta completar algunos pasos:</p>
          <ul className="m-0 mt-2 space-y-1">
            {pending.map((step) => (
              <li key={step.id}>
                {step.label}:{' '}
                <button type="button" onClick={() => goTo(step.id)} className="cursor-pointer font-semibold underline">Ir al paso</button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="m-0 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          El plan está completo. Revisalo y, si todo está bien, guardalo. Después vas a poder exportarlo como PDF.
        </p>
      )}

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <PlanDocumentContent plan={plan} patient={patient} authorName={authorName} />
      </div>
    </div>
  );
}
