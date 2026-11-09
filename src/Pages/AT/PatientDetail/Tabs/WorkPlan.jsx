import { useMemo, useState } from "react";
import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import { PrintablePlan } from "../../../../components/AT/PlanWizard/PlanDocument";
import { formatDate } from "../../../../utils/utils";
import { savePlan } from "../../../../services/planService";
import { useAuth } from "../../../../hooks/useAuth";
import { frequencyLabel, normalizePlan, settingLabel } from "../../../../utils/planModel";
import ActionButton  from "../../../../components/AT/ActionButton/ActionButton";
import Pill from "../../../../components/AT/Pill/Pill";
import EmptyState from "../../../../components/AT/EmptyState/EmptyState";
import BulletList from "../../../../components/AT/BulletList/BulletList";
import PlanWizard from "../../../../components/AT/PlanWizard/PlanWizard";

export default function WorkPlan ({ patient, onPlanSaved }) {
    const { token, user } = useAuth ();

    const [editing, setEditing] = useState (false);
    const [savedPlan, setSavedPlan] = useState (null);

    // normalizePlan deja los objetivos específicos como { id, text }, también en los planes guardados cuando eran texto suelto
    const plan = useMemo (() => normalizePlan (savedPlan ?? patient.plan), [savedPlan, patient.plan]);

    const authorName = [user?.name, user?.lastName].filter (Boolean).join (" ") || "Acompañante terapéutico";

    const handleSaved = saved => {
        setSavedPlan (saved);
        onPlanSaved?.(saved);
        if (saved.status === "active") setEditing (false);
    };

    if (editing) {
        return (
            <PlanWizard patient={patient} initialPlan={plan} onSave={draft => savePlan (patient.id, draft, token)} onSaved={handleSaved} onCancel={() => setEditing (false)}/>
        );
    }

    if (!plan) {
        return (
            <EmptyState title={"Todavía no armaste un plan de trabajo"} text={"El plan define los objetivos, las áreas de intervención y las estrategias del acompañamiento, y sirve de referencia para registrar cada encuentro"}>
                <ActionButton onClick={() => setEditing (true)}>
                    Armar plan de trabajo
                </ActionButton>
            </EmptyState>
        )
    }

    const isDraft = plan.status === "draft";

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Estado
                        </dt>
                        <dd className="mt-1">
                            <Pill tone={isDraft ? "neutral" : "success"}>
                                {isDraft ? "Borrador" : "Vigente"}
                            </Pill>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Vigente desde
                        </dt>
                        <dd className="mt-1 p-1 text-sm">
                            {formatDate (plan.validFrom)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Vigente hasta
                        </dt>
                        <dd className="mt-1 p-1 text-sm">
                            {formatDate (plan.validUntil)}
                        </dd>
                    </div>
                </dl>
                <div className="flex flex-wrap gap-3">
                    {!isDraft && (
                        <ActionButton variant={"secondary"} onClick={() => window.print ()}>
                            Exportar a PDF
                        </ActionButton>
                    )}
                    <ActionButton onClick={() => setEditing (true)}>
                        {isDraft ? "Continuar editando" : "Editar plan"}
                    </ActionButton>
                </div>
            </div>

            {isDraft ? (
                <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                    Este plan es un borrador. Completalo y guardalo para dejarlo vigente y poder exportarlo.
                </p>
            ) : (
                <p className="text-xs text-text-muted">
                    Al exportar se abre el cuadro de impresión: elegí "Guardar como PDF" como destino.
                </p>
            )}

            {plan.rationale?.trim () && (
                <CardPatientDetail title={"Fundamentación"}>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                        {plan.rationale}
                    </p>
                </CardPatientDetail>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                <CardPatientDetail title={"Objetivos generales"}>
                    {plan.generalGoals.length > 0 ? (
                        <BulletList items={plan.generalGoals}/>
                    ) : (
                        <p className="text-sm text-text-muted">Sin definir</p>
                    )}
                </CardPatientDetail>
                <CardPatientDetail title={"Áreas de intervención"}>
                    {plan.areas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {plan.areas.map (area => (
                                <Pill key={area}>
                                    {area}
                                </Pill>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted">Sin definir</p>
                    )}
                </CardPatientDetail>
            </div>

            {/* Un bloque por ámbito de trabajo */}
            {plan.stages.map (stage => (
                <section key={stage.id} aria-label={stage.name} className="space-y-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <h3 className="text-lg font-bold">
                            {stage.name}
                        </h3>
                        {plan.settings.length > 0 && (
                            <Pill tone={"neutral"}>
                                {settingLabel (stage.setting)}
                            </Pill>
                        )}
                        {stage.period && <span className="text-sm text-text-secondary">{stage.period}</span>}
                        {stage.frequency && <span className="text-sm text-text-secondary">{stage.frequency}</span>}
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        <CardPatientDetail title={"Objetivos específicos"}>
                            <ol className="space-y-3">
                                {stage.specificGoals.map ((goal, index) => (
                                    <li key={goal.id} className="flex gap-3 text-sm text-text-secondary">
                                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                            {index + 1}
                                        </span>
                                        {goal.text}
                                    </li>
                                ))}
                            </ol>
                        </CardPatientDetail>
                        <CardPatientDetail title={"Actividades previstas"}>
                            {stage.activities.length > 0 ? (
                                <BulletList items={stage.activities}/>
                            ) : (
                                <p className="text-sm text-text-muted">Sin definir</p>
                            )}
                        </CardPatientDetail>
                        <CardPatientDetail title={"Estrategias"}>
                            {stage.strategies.length > 0 ? (
                                <BulletList items={stage.strategies}/>
                            ) : (
                                <p className="text-sm text-text-muted">Sin definir</p>
                            )}
                        </CardPatientDetail>
                    </div>
                </section>
            ))}

            {plan.familyTeam.length > 0 && (
                <CardPatientDetail title={"Trabajo con la familia y el equipo"}>
                    <BulletList items={plan.familyTeam}/>
                </CardPatientDetail>
            )}

            {(plan.evaluation.criteria.length > 0 || plan.evaluation.reportsFrequency) && (
                <CardPatientDetail title={"Evaluación y seguimiento"}>
                    {plan.evaluation.criteria.length > 0 && <BulletList items={plan.evaluation.criteria}/>}
                    {plan.evaluation.reportsFrequency && (
                        <p className="mt-3 text-sm text-text-secondary">
                            Informes de evolución: <span className="font-medium text-text">{frequencyLabel (plan.evaluation.reportsFrequency)}</span>
                        </p>
                    )}
                    {plan.evaluation.notes?.trim () && (
                        <p className="mt-3 whitespace-pre-line text-sm text-text-secondary">{plan.evaluation.notes}</p>
                    )}
                </CardPatientDetail>
            )}

            {plan.atRole?.trim () && (
                <CardPatientDetail title={"Rol del acompañante"}>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">{plan.atRole}</p>
                </CardPatientDetail>
            )}

            {!isDraft && <PrintablePlan plan={plan} patient={patient} authorName={authorName}/>}
        </div>
    )
}
