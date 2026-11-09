import { useState } from "react";
import { Link } from "react-router";
import { useMyPatients } from "../../hooks/useMyPatients";
import { RELATIONSHIP_LABELS, TREATMENT_STATUS_LABELS } from "../../utils/constants";
import { ageFromDate, formatDate, fullName, initials, shortName } from "../../utils/utils";
import PatientForm from "../../components/PatientForm/PatientForm";
import Pill from "../../components/AT/Pill/Pill";

const CARD = "rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8";

// Vínculo dicho desde el titular de la cuenta: "Soy yo", "Soy su madre / padre", "Otro vínculo"
const relationshipText = relationship => {
    if (relationship === "SELF" || relationship === "OTHER") return RELATIONSHIP_LABELS[relationship];
    return `Soy su ${(RELATIONSHIP_LABELS[relationship] ?? "familiar").toLowerCase ()}`;
};

function PatientCard ({ patient, onEdit }) {
    const age = ageFromDate (patient.dateOfBirth);
    // Los acompañamientos finalizados no se muestran: solo los profesionales que hoy trabajan con la persona
    const treatments = (patient.treatments ?? []).filter (treatment => treatment.status !== "FINISHED");

    return (
        <li className={CARD}>
            <div className="flex items-start gap-4">
                <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-light text-lg font-semibold text-primary">
                    {initials (shortName (patient))}
                </div>
                <div className="min-w-0 flex-1">
                    <h2 className="m-0 break-words text-xl font-bold text-text">{fullName (patient)}</h2>
                    <p className="m-0 mt-1 text-sm text-text-secondary">
                        {age != null ? `${age} años · Nació el ${formatDate (patient.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })}` : "Falta cargar la fecha de nacimiento"}
                    </p>
                    <div className="mt-2">
                        <Pill tone="neutral">{relationshipText (patient.relationship)}</Pill>
                    </div>
                </div>
                <button type="button" onClick={() => onEdit (patient)} className="shrink-0 cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30">
                    Editar
                </button>
            </div>

            {(patient.diagnosis || patient.notes) && (
                <dl className="mt-5 grid gap-4 border-t border-border pt-5">
                    {patient.diagnosis && (
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Diagnóstico</dt>
                            <dd className="m-0 mt-1 break-words text-sm text-text">{patient.diagnosis}</dd>
                        </div>
                    )}
                    {patient.notes && (
                        <div>
                            <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Información adicional</dt>
                            <dd className="m-0 mt-1 whitespace-pre-line break-words text-sm text-text">{patient.notes}</dd>
                        </div>
                    )}
                </dl>
            )}

            <div className="mt-5 border-t border-border pt-5">
                <p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-secondary">Acompañantes</p>
                {treatments.length > 0 ? (
                    <ul className="m-0 mt-2 list-none space-y-2 p-0">
                        {treatments.map (treatment => (
                            <li key={treatment.id} className="flex flex-wrap items-center gap-2 text-sm text-text">
                                {/* El perfil público se busca por el id del perfil de AT, no por el id del usuario */}
                                <Link to={`/profileAT/at/${treatment.profileAT?.id}`} className="font-semibold text-primary hover:underline">
                                    {fullName (treatment.profileAT?.user) || "Acompañante terapéutico"}
                                </Link>
                                <Pill tone={treatment.status === "ACTIVE" ? "success" : "neutral"}>{TREATMENT_STATUS_LABELS[treatment.status] ?? treatment.status}</Pill>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="m-0 mt-2 text-sm text-text-secondary">
                        Todavía no tiene un acompañante. <Link to="/searchAT" className="font-semibold text-primary hover:underline">Buscar acompañantes</Link>
                    </p>
                )}
            </div>
        </li>
    );
}

// Personas a cargo del usuario con sesión iniciada: quienes reciben (o van a recibir) el acompañamiento.
// La cuenta es de quien gestiona (un familiar, un tutor o la propia persona); las solicitudes y entrevistas se piden para una de estas personas
export default function Patients () {
    const { patients, loading, error, upsertPatient } = useMyPatients ();

    // null = no se muestra el formulario; { patient: null } = alta; { patient } = edición
    const [formState, setFormState] = useState (null);
    const [successMessage, setSuccessMessage] = useState ("");

    const openForm = patient => {
        setSuccessMessage ("");
        setFormState ({ patient });
        window.scrollTo ({ top: 0, behavior: "smooth" });
    };

    const handleSaved = saved => {
        upsertPatient (saved);
        setSuccessMessage (formState?.patient ? `Se actualizaron los datos de ${fullName (saved)}` : `Se cargó a ${fullName (saved)}`);
        setFormState (null);
    };

    return (
        <main className="min-h-page bg-background px-4 py-8 font-sans sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="m-0 text-3xl font-bold text-text">Personas acompañadas</h1>
                        <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">
                            Cargá a quienes van a recibir el acompañamiento: un familiar a tu cargo o vos. Después elegís para quién es cada solicitud o entrevista
                        </p>
                    </div>
                    {!formState && !loading && !error && (
                        <button type="button" onClick={() => openForm (null)} className="shrink-0 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
                            + Cargar persona
                        </button>
                    )}
                </header>

                {successMessage && (
                    <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                {formState && (
                    <section className={CARD}>
                        <h2 className="m-0 mb-6 border-b border-border pb-4 text-xl font-bold text-text">
                            {formState.patient ? `Editar a ${fullName (formState.patient)}` : "Cargar persona"}
                        </h2>
                        {/* La key reinicia el formulario al pasar de editar a una persona a editar a otra */}
                        <PatientForm key={formState.patient?.id ?? "new"} patient={formState.patient} onSaved={handleSaved} onCancel={() => setFormState (null)}/>
                    </section>
                )}

                {loading ? (
                    <p className="text-sm text-text-secondary">Cargando personas...</p>
                ) : patients.length === 0 && !error && !formState ? (
                    <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                        <p className="m-0 font-semibold text-text">Todavía no cargaste a nadie</p>
                        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                            Para pedirle una entrevista o una vinculación a un acompañante primero tenés que indicar quién va a recibir el acompañamiento
                        </p>
                        <button type="button" onClick={() => openForm (null)} className="mt-5 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
                            Cargar persona
                        </button>
                    </div>
                ) : (
                    <ul className="m-0 list-none space-y-6 p-0">
                        {patients.map (patient => <PatientCard key={patient.id} patient={patient} onEdit={openForm}/>)}
                    </ul>
                )}
            </div>
        </main>
    );
}
