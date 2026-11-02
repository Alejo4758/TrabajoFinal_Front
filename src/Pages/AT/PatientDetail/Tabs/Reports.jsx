import { CardPatientDetail } from '../../../../components/AT/CardPatientDetail/CardPatientDetail';
import { ActionButton } from '../../../../components/AT/ActionButton/ActionButton';
import { formatDate } from '../../../../utils/utils';
import EmptyState from '../../../../components/AT/EmptyState/EmptyState';
import Pill from '../../../../components/AT/Pill/Pill';

export default function Reports ({ patient }) {
    if (patient.reports.length === 0) {
        return (
            <EmptyState title="Todavía no generaste informes" text="El informe mensual reúne la información registrada durante el período. Vas a poder revisarlo y completarlo antes de finalizarlo">
                <ActionButton>
                    Generar informe mensual
                </ActionButton>
            </EmptyState>
        );
    }

    return (
        <CardPatientDetail title="Informes mensuales" subtitle={`${patient.reports.length} generados`} action={<ActionButton>Generar informe</ActionButton>}>
            <ul className="divide-y divide-border">
                {patient.reports.map (report => (
                    <li key={report.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">
                                {report.title}
                            </p>
                            <p className="mt-1 text-sm text-text-muted">
                                Período: {report.period} · Generado el {formatDate (report.createdAt)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Pill tone={report.status === 'Finalizado' ? 'success' : 'warning'}>
                                {report.status}
                            </Pill>
                            <ActionButton variant="secondary">
                                {report.status === "Finalizado" ? "Descargar" : "Completar"}
                            </ActionButton>
                        </div>
                    </li>
                ))}
            </ul>
        </CardPatientDetail>
    );
}