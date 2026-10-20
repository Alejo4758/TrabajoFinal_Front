import { Link } from "react-router";
import { calculateAge, formatAvailability } from "../../utils/utils";

export default function ATCard ({ id, name = "", lastName = "", dateOfBirth = "", localities = [], image = null, specialties = [], socialPrograms = [], availability = [] }) {    
    
    return (
        <article className="flex h-full flex-col border border-border bg-surface rounded-2xl p-5">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 shrink-0 size-20">
                    <img src={image} alt={`Perfil de ${name}`} className="h-full w-full object-cover"/>
                </div>
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
                    <h3 className="mb-1 text-xs font-medium text-text-secondary">
                        Disponibilidad Horaria
                    </h3>
                    <p className="text-sm font-medium text-text">
                        {formatAvailability (availability)}
                    </p>
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