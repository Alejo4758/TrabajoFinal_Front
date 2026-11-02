import { formatDate } from "../../../../utils/utils";
import { ActionButton } from "../../../../components/AT/ActionButton/ActionButton";
import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import Pill from "../../../../components/AT/Pill/Pill";
import EmptyState from "../../../../components/AT/EmptyState/EmptyState";
import BulletList from "../../../../components/AT/BulletList/BulletList";

export default function WorkPlan ({ patient }) {
    const { plan } = patient;

    if (!plan) {
        return (
            <EmptyState title={"Todavía no armaste un plan de trabajo"} text={"El plan define los objetivos, las áreas de intervención y las estrategias del acompañamiento, y sirve de referencia para registrar cada encuentro"}>
                <ActionButton>
                    Armar plan de trabajo
                </ActionButton>
            </EmptyState>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <dl className="flex flex-wrap gap-x-8 gap-y-3">
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Vigente desde
                        </dt>
                        <dd className="mt-1 text-sm">
                            {formatDate (plan.startDate)}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Próxima revisión
                        </dt>
                        <dd className="mt-1 text-sm">
                            {formatDate (plan.reviewDate)}
                        </dd>
                    </div>
                </dl>
                <div className="flex flex-wrap gap-3">
                    <ActionButton variant={"secondary"}>
                        Exportar a PDF
                    </ActionButton>
                    <ActionButton>
                        Editar plan
                    </ActionButton>
                </div>
            </div>
            <CardPatientDetail title={"Objetivo general"}>
                <p className="text-sm leading-relaxed text-text-secondary">
                    {plan.generalGoal}
                </p>
            </CardPatientDetail>
            <div className="grid gap-6 lg:grid-cols-2">
                <CardPatientDetail title={"Objetivos específicos"}>
                    <ol className="space-y-3">
                        {plan.specificGoals.map ((goal, index) => (
                            <li key={goal} className="flex gap-3 text-sm text-text-secondary">
                                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {index + 1}
                                </span>
                                {goal}
                            </li>
                        ))}
                    </ol>
                </CardPatientDetail>
                <CardPatientDetail title={"Áreas de intervención"}>
                    <div className="flex flex-wrap gap-2">
                        {plan.areas.map (area => (
                            <Pill key={area}>
                                {area}
                            </Pill>
                        ))}
                    </div>
                </CardPatientDetail>
                <CardPatientDetail title={"Actividades previstas"}>
                    <BulletList items={plan.activities}/>
                </CardPatientDetail>
                <CardPatientDetail title={"Estrategias"}>
                    <BulletList items={plan.strategies}/>
                </CardPatientDetail>
            </div>
        </div>   
    )
}