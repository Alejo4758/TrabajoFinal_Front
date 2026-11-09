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
            <CardPatientDetail title={"Datos del paciente"} subtitle={"Información cargada por la familia"}>
                <dl className="grid gap-5 sm:grid-cols-3">
                    <InfoRow label="Edad">
                        {patient.age != null && `${patient.age} años`}
                    </InfoRow>
                    <div className="sm:col-span-2">
                        <InfoRow label="Diagnóstico">
                            {patient.diagnosis}
                        </InfoRow>
                    </div>
                </dl>
                {patient.notes && (
                    <p className="mt-5 whitespace-pre-line break-words rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-text-secondary">
                        {patient.notes}
                    </p>
                )}
            </CardPatientDetail>
            <CardPatientDetail title={"Sobre el acompañamiento"} subtitle={"Información de la solicitud de vinculación"}>
                <p className="whitespace-pre-line break-words rounded-lg border border-border bg-background p-4 text-sm leading-relaxed text-text-secondary">
                    {patient.case.description || "La solicitud no tiene una descripción del caso"}
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
            {/* El responsable es el titular de la cuenta que cargó al paciente. Si el paciente es el propio titular, no hay uno aparte */}
            <CardPatientDetail title={"Responsable"} subtitle={"Persona de contacto del acompañamiento"}>
                {patient.guardian ? (
                    <dl className="grid gap-5 sm:grid-cols-3">
                        <InfoRow label={"Nombre"}>
                            {patient.guardian.name}
                        </InfoRow>
                        <InfoRow label={"Vínculo con el paciente"}>
                            {patient.guardian.relationship}
                        </InfoRow>
                        <InfoRow label={"Correo electrónico"}>
                            {patient.guardian.email && <span className="break-all">{patient.guardian.email}</span>}
                        </InfoRow>
                    </dl>
                ) : (
                    <p className="text-sm text-text-muted">
                        El paciente gestiona su propia cuenta: podés escribirle por el chat
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