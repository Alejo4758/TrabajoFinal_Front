import { useEffect, useRef, useState } from 'react';
import { STEP_IDS, emptyPlan, newStage, normalizePlan, validatePlan, validatePlanStep } from '../../../utils/planModel';
import { DataStep, EvaluationStep, FamilyStep, GoalsStep, RationaleStep, ReviewStep, StagesStep } from './Steps';
import { useAuth } from '../../../hooks/useAuth';
import { useUnsavedChangesGuard } from '../../../hooks/useUnsavedChangesGuard';
import ActionButton from '../ActionButton/ActionButton';

const STEPS = [
  { id: "datos", label: "Datos", title: "Datos del acompañamiento" },
  { id: "fundamentacion", label: "Fundamentación", title: "Fundamentación" },
  { id: "objetivos", label: "Objetivos", title: "Objetivos generales" },
  { id: "ambitos", label: "Ámbitos", title: "Ámbitos de trabajo" },
  { id: "familia", label: "Familia y equipo", title: "Familia y equipo" },
  { id: "evaluacion", label: "Evaluación", title: "Evaluación y seguimiento" },
  { id: "revision", label: "Revisión", title: "Revisión del plan" }
];

const EDITABLE_STEPS = STEPS.filter (s => s.id !== "revision");

function focusTargetFor (key) {
  if (key.startsWith ("stage:")) {
    const [id, field] = key.split (":");
    if (field === "name") return `stage-${id}-name`;
    if (field === "goals") return `stage-${id}-goals-new`;
    return `stage-${id}-activities-new`;
  }
  if (key === "generalGoals" || key === "criteria") return `plan-${key}-new`;
  if (key === "stages") return "plan-add-stage";
  return `plan-${key}`;
}

export default function PlanWizard ({ patient, initialPlan, onSave, onCancel, onSaved }) {
  // Un plan nuevo arranca con el diagnóstico que la familia cargó para el paciente (el profesional lo puede corregir)
  const [plan, setPlanState] = useState (() => (initialPlan ? JSON.parse (JSON.stringify (normalizePlan (initialPlan))) : { ...emptyPlan (), diagnosis: patient?.diagnosis ?? "" }));
  const [stepIndex, setStepIndex] = useState (0);
  const [visited, setVisited] = useState ([0]);
  const [errors, setErrors] = useState ({});
  const [notice, setNotice] = useState ("");
  const [saving, setSaving] = useState (false);
  const [serverError, setServerError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState (false);

  // El plan tal como quedó guardado por última vez: compararlo con el actual dice si hay cambios sin guardar
  const [savedSnapshot, setSavedSnapshot] = useState (() => JSON.stringify (plan));

  const headingRef = useRef (null);
  const firstRender = useRef (true);

  const { user } = useAuth ();
  const authorName = [user?.name, user?.lastName].filter (Boolean).join (" ") || "Acompañante terapéutico";


  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const dirty = JSON.stringify (plan) !== savedSnapshot;
  const problems = validatePlan (plan);
  // Hay un solo plan por acompañamiento y cada guardado lo reemplaza: guardar un plan vigente como borrador lo dejaría sin vigencia
  const isActivePlan = plan.status === "active";

  // El botón Cancelar ya pide confirmación; esto cubre recargar o cerrar la pestaña y los enlaces a otras páginas de la app
  useUnsavedChangesGuard (dirty);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus ();
    headingRef.current?.scrollIntoView ({ block: "start", behavior: "smooth" });
  }, [stepIndex]);

  const setPlan = next => {
    setPlanState (next);
    setNotice ("");
    setServerError ("");
    if (Object.keys (errors).length > 0) setErrors(validatePlanStep (step.id, next));
  };

  const focusFirst = found => {
    const key = Object.keys (found)[0];
    if (key) document.getElementById (focusTargetFor (key))?.focus ();
  };

  const goToStep = index => {
    if (STEPS[index].id === "ambitos" && plan.stages.length === 0) {
      setPlanState ({ ...plan, stages: (plan.settings.length ? plan.settings : ["home"]).map (s => newStage (s)) });
    }
    setStepIndex (index);
    setVisited(prev => (prev.includes (index) ? prev : [...prev, index]));
    setErrors ({});
    setServerError ("");
  };

  const handleNext = () => {
    const found = validatePlanStep (step.id, plan);
    if (Object.keys (found).length > 0) {
      setErrors (found);
      focusFirst (found);
      return;
    }
    goToStep (stepIndex + 1);
  };

  const save = async status => {
    if (status === "active" && Object.keys (problems).length > 0) {
      const firstId = STEP_IDS.find(id => problems[id]);
      const index = STEPS.findIndex(s => s.id === firstId);
      goToStep (index);
      setErrors (problems[firstId]);
      setServerError (`Para guardar el plan, completá el paso "${STEPS[index].label}".`);
      return;
    }

    setSaving (true);
    setServerError ("");
    try {
      const saved = await onSave ({ ...plan, status });
      onSaved?.(saved);
      if (status === "draft") {
        const next = { ...plan, id: saved.id, status: "draft" };
        setPlanState (next);
        setSavedSnapshot (JSON.stringify (next));
        setNotice ("Borrador guardado");
      }
    } catch (err) {
      setServerError (err.message || "Hubo un error al guardar el plan. Intentá nuevamente");
    } finally {
      setSaving (false);
    }
  };

  const handleCancel = () => (dirty ? setConfirmCancel (true) : onCancel ());

  const stepProps = { plan, setPlan, errors, patient, authorName };

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <header className="border-b border-border p-5 sm:p-6">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          {patient.name}
        </p>
        <h2 className="m-0 mt-1 text-xl font-bold sm:text-2xl">
          {initialPlan ? "Editar plan de trabajo" : "Armar plan de trabajo"}
        </h2>
        <nav className="mt-5 hidden md:block">
          <ol className="m-0 flex list-none items-center gap-2 p-0">
            {STEPS.map ((s, index) => {
              const current = index === stepIndex;
              const reachable = visited.includes (index) || index < stepIndex;
              const complete = s.id !== "revision" && visited.includes (index) && Object.keys (validatePlanStep (s.id, plan)).length === 0;
              return (
                <li key={s.id} className="flex flex-1 items-center gap-2 last:flex-none">
                  <button type="button" disabled={!reachable} onClick={() => goToStep (index)} className={`flex cursor-pointer items-center gap-2 rounded-lg py-1 pr-1 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed ${current ? "font-semibold text-primary" : reachable ? "text-text" : "text-text-muted"}`}>
                    <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${current ? "bg-primary text-white" : complete ? "bg-primary/15 text-primary" : "bg-surface-alt text-text-secondary"}`}>
                      {complete && !current ? "✓" : index + 1}
                    </span>
                    <span className="hidden whitespace-nowrap xl:inline">
                      {s.label}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && <span className="h-px flex-1 bg-border"/>}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="mt-4 md:hidden">
          <p className="m-0 text-sm text-text-secondary">
            Paso {stepIndex + 1} de {STEPS.length} · <span className="font-semibold text-text">{step.label}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}/>
          </div>
        </div>
      </header>
      <div className="space-y-5 p-5 sm:p-6">
        <h3 ref={headingRef} tabIndex={-1} className="m-0 text-lg font-bold focus:outline-none">
          {step.title}
        </h3>
        {Object.keys (errors).length > 0 && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            Revisá los campos marcados en rojo para continuar
          </div>
        )}
        {serverError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{serverError}</div>}
        {notice && <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{notice}</div>}
        {step.id === "datos" && <DataStep {...stepProps}/>}
        {step.id === "fundamentacion" && <RationaleStep {...stepProps}/>}
        {step.id === "objetivos" && <GoalsStep {...stepProps}/>}
        {step.id === "ambitos" && <StagesStep {...stepProps}/>}
        {step.id === "familia" && <FamilyStep {...stepProps}/>}
        {step.id === "evaluacion" && <EvaluationStep {...stepProps}/>}
        {step.id === "revision" && (
          <ReviewStep plan={plan} patient={patient} authorName={authorName} problems={problems} steps={EDITABLE_STEPS} goTo={id => goToStep(STEPS.findIndex(s => s.id === id))}/>
        )}
      </div>
      {confirmCancel && (
        <div className="mx-5 mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-6">
          <p className="m-0 font-semibold">
            Hay cambios sin guardar
          </p>
          <p className="m-0 mt-1">
            Si salís ahora, se pierden.{!isActivePlan && " Podés guardarlos como borrador antes"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ActionButton variant="secondary" onClick={() => setConfirmCancel (false)}>
              Seguir editando
            </ActionButton>
            <ActionButton variant="secondary" onClick={onCancel}>
              Salir sin guardar
            </ActionButton>
          </div>
        </div>
      )}
      <footer className="sticky bottom-0 z-10 flex flex-col gap-3 rounded-b-2xl border-t border-border bg-surface/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <button type="button" onClick={handleCancel} disabled={saving} className="cursor-pointer self-start text-sm font-medium text-text-secondary hover:text-text focus:outline-none focus:underline disabled:opacity-60">
          Cancelar
        </button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {!isActivePlan && (
            <ActionButton variant="secondary" disabled={saving} onClick={() => save("draft")}>
              {saving ? "Guardando..." : "Guardar borrador"}
            </ActionButton>
          )}
          {stepIndex > 0 && <ActionButton variant="secondary" disabled={saving} onClick={() => goToStep (stepIndex - 1)}>Anterior</ActionButton>}
          {isLast ? (
            <ActionButton disabled={saving} onClick={() => save('active')}>
              {saving ? "Guardando..." : "Guardar plan"}
            </ActionButton>
          ) : (
            <ActionButton disabled={saving} onClick={handleNext}>
              Siguiente
            </ActionButton>
          )}
        </div>
      </footer>
    </div>
  );
}
