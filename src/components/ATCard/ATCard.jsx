import { Link } from "react-router";
import { calculateAge } from "../../utils/utils";
import AvailabilitySummary from "../AvailabilitySummary/AvailabilitySummary";
import Avatar from "../Avatar/Avatar";

export default function ATCard ({ id, name = "", lastName = "", dateOfBirth = "", localities = [], profilePicture = null, specialties = [], socialPrograms = [], availability = [] }) {

    return (
        <article className="flex h-full flex-col border border-border bg-surface rounded-2xl p-5">
            <div className="flex items-center gap-4">
                {/* La foto que el A.T. subió en "Mi perfil"; si no subió ninguna, sus iniciales. El nombre está al lado */}
                <Avatar image={profilePicture} name={`${name} ${lastName}`} className="size-20 border-2 border-primary/20 text-2xl"/>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight text-text">
                        {name} {lastName}
                    </h2>
                    <p className="mt-1 text-sm text-text-secondary">
                        {calculateAge (dateOfBirth)} años
                    </p>
                </div>
            </div>
            <div className="my-5 border-t border-border"/>
            <div className="flex-1 flex flex-col gap-5">
                <section>
                    <h3 className="mb-3 text-sm font-semibold text-text">
                        Especialidades
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {specialties.map (specialty => (
                            <span key={specialty} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                                {specialty}
                            </span>
                        ))}
                    </div>
                </section>
                <section>
                    <h3 className="mb-3 text-sm font-semibold text-text">
                        Obras Sociales
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {socialPrograms.map (program => (
                            <span key={program} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                                {program}
                            </span>
                        ))}
                    </div>
                </section>
                <section>
                    <h3 className="mb-3 text-sm font-semibold text-text">
                        Localidades de Trabajo
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {localities.map (locality => (
                            <span key={locality} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                                {locality}
                            </span>
                        ))}
                    </div>
                </section>
                <section className="mt-auto rounded-xl bg-surface-alt p-3">
                    <h3 className="mb-2 text-xs font-medium text-text-secondary">
                        Disponibilidad Horaria
                    </h3>
                    <AvailabilitySummary availability={availability} compact/>
                </section>          
            </div>
            <div className="mt-5 border-t border-border pt-4 shrink-0">
                <Link className="flex justify-center w-full rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white" to={`/profileAT/at/${id}`}>
                    Ver perfil
                </Link>
            </div>
        </article>
    );
}