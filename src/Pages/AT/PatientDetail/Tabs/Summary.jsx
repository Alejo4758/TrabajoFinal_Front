import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import { InfoRow } from "../../../../components/AT/InfoRow/InfoRow";
import { formatDate } from "../../../../utils/utils";

export default function SummaryTab ({ patient }) {
  const doneGoals = patient.objectives.filter (o => (o.history.at (-1)?.value ?? 0) >= 80).length;
  const inProgress = patient.objectives.length - doneGoals;

  const stats = [
    { label: "Encuentros registrados", value: patient.sessions.length },
    { label: "Objetivos en curso", value: inProgress },
    { label: "Objetivos logrados", value: doneGoals }
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
            <CardPatientDetail title={"Sobre el acompañamiento"} subtitle={"Información de la solicitud de vinculación"}>
                <p className="rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-text-secondary">
                    {patient.case.description}
                </p>
                <dl className="mt-5 grid gap-5 sm:grid-cols-3">
                    <InfoRow label="Zona de trabajo">
                        {patient.case.locality}
                    </InfoRow>
                    <InfoRow label="Cobertura">
                        {patient.case.socialProgram}
                    </InfoRow>
                    <InfoRow label="Inicio del acompañamiento">
                        {formatDate(patient.startDate)}
                    </InfoRow>
                </dl>
            </CardPatientDetail>
            <CardPatientDetail title={"Responsable"} subtitle={"Persona de contacto del acompañamiento"}>
                {patient.guardian ? (
                    <dl className="grid gap-5 sm:grid-cols-2">
                        <InfoRow label={"Nombre"}>
                            {patient.guardian.name}
                        </InfoRow>
                        <InfoRow label={"Vínculo"}>
                            {patient.guardian.relationship}
                        </InfoRow>
                        <InfoRow label={"Teléfono"}>
                            {patient.guardian.phone}
                        </InfoRow>
                        <InfoRow label={"Correo electrónico"}>
                            {patient.guardian.email}
                        </InfoRow>
                    </dl>
                ) : (
                    <p className="text-sm text-muted">
                        Todavía no hay un responsable registrado
                    </p>
                )}
            </CardPatientDetail>
        </div>
        <div className="space-y-6">
            <CardPatientDetail title={"Próximo encuentro"}>
                {patient.nextMeeting ? (
                    <div className="flex items-center gap-4">
                        <div className="min-w-20 rounded-lg bg-primary-light px-3 py-2 text-center">
                            <p className="text-xs font-medium text-primary">
                                {formatDate (patient.nextMeeting.date, { day: "numeric", month: "short" })}
                            </p>
                            <p className="text-sm font-bold text-primary">
                                {patient.nextMeeting.time}
                            </p>
                        </div>
                        <p className="text-sm text-text-secundary">
                            {patient.nextMeeting.type}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm text-text-muted">
                        No hay encuentros programados
                    </p>
                )}
            </CardPatientDetail>
            <CardPatientDetail title={"Estadísticas"}>
                <dl className="space-y-4">
                    {stats.map (stat => (
                        <div key={stat.label} className="flex items-baseline justify-between gap-4 border-b border-border pb-3 last:border-b-0 last:pb-0">
                            <dt className="text-sm text-text-secondary">
                                {stat.label}
                            </dt>
                            <dd className="text-2xl font-bold">
                                {stat.value}
                            </dd>
                        </div>
                    ))}
                </dl>
            </CardPatientDetail>
        </div>
    </div>
  );
}