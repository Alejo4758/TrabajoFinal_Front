import { Link } from "react-router";
import { calculateAge } from "../../utils/utils";
import AvailabilitySummary from "../AvailabilitySummary/AvailabilitySummary";
import Avatar from "../Avatar/Avatar";

const MAX_CHIPS = 3

function ChipList ({ items }) {
    if (!items?.length) return <p className="text-sm text-text-muted">No especificado</p>;
    
    const visible = items.slice (0, MAX_CHIPS);
    const rest = items.slice (MAX_CHIPS);
    const chipClass = "bg-primary/10 text-primary";
    
    return (
        <ul className="flex flex-wrap gap-1.5">
            {visible.map (item => (
                <li key={item} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${chipClass}`}>
                    {item}
                </li>
            ))}
            {rest.length > 0 && (
                <li className="rounded-lg bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary" title={rest.join (", ")}>
                    <span>
                        +{rest.length} más
                    </span>
                    <span className="sr-only">
                        y {rest.length} más: {rest.join (", ")}
                    </span>
                </li>
            )}
        </ul>
    );
}

function Detail ({ label, children }) {
    return (
        <div>
            <dt className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                {label}
            </dt>
            <dd className="m-0">
                {children}
            </dd>
        </div>
    );
}

export default function ATCard ({
    id,
    name = "",
    lastName = "",
    dateOfBirth = "",
    localities = [],
    profilePicture = null,
    specialties = [],
    socialPrograms = [],
    availability = []
}) {
    return (
        <article className="flex h-full w-full flex-col border border-border bg-surface rounded-2xl p-5">
            <div className="flex items-center gap-4">
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
            <div className="my-6 flex-1 flex flex-col gap-5">
                <Detail label={"Especialidades"}>
                    <ChipList items={specialties}/>
                </Detail>
                <Detail label={"Obras Sociales"}>
                    <ChipList items={socialPrograms}/>
                </Detail>
                <Detail label={"Zonas de trabajo"}>
                    <ChipList items={localities}/>
                </Detail>
                <section className="mt-auto rounded-xl bg-surface-alt p-3">
                    <h3 className="mb-2 text-xs font-medium text-text-secondary">
                        Disponibilidad Horaria
                    </h3>
                    <AvailabilitySummary availability={availability} compact/>
                </section>          
            </div>
            <div className="pt-4 shrink-0">
                <Link className="flex justify-center w-full rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary 
                                 transition-colors hover:bg-primary hover:text-white" to={`/profileAT/at/${id}`}>
                    Ver perfil
                </Link>
            </div>
        </article>
    );
}