export default function ATCard ({ name = "", lastName = "", dateOfBirth = "", locality = [], image = "", specialties = [], socialPrograms = [], availabilityHours = "A convenir" }) {    
    const calculateAge = dateOfBirth => {
        if (!dateOfBirth) return "--";
        const today = new Date ();
        const birth = new Date (`${dateOfBirth}T00:00:00`);
        let age = today.getFullYear () - birth.getFullYear ();
        if (today.getMonth () < birth.getMonth() || (today.getMonth () === birth.getMonth () && today.getDate () < birth.getDate ()))  age--;
        return age;
    };

    const age = calculateAge (dateOfBirth);

    return (
        <article className="flex flex-col border border-border bg-surface rounded-2xl p-5">
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 shrink-0 size-20">
                    <img src={image} alt={`Perfil de ${name}`} className="h-full w-full object-cover"/>
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg font-semibold leading-tight text-text">{name} {lastName}</h2>
                    <p className="mt-1 text-sm text-text-secondary">{age} años</p>
                </div>
            </div>
            <div className="my-5 border-t border-border"/>
            <section className="mb-5">
                <h3 className="mb-3 text-sm font-semibold text-text">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                    {specialties.map (specialty => (
                        <span key={specialty} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                            {specialty}
                        </span>
                    ))}
                </div>
            </section>
            <section className="mb-5">
                <h3 className="mb-3 text-sm font-semibold text-text">Obras Sociales</h3>
                <div className="flex flex-wrap gap-2">
                    {socialPrograms.map (program => (
                        <span key={program} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                            {program}
                        </span>
                    ))}
                </div>
            </section>
            <section className="mb-5">
                <h3 className="mb-3 text-sm font-semibold text-text">Localidades de trabajo</h3>
                <div className="flex flex-wrap gap-2">
                    {locality.map (loc => (
                        <span key={loc} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                            {loc}
                        </span>
                    ))}
                </div>
            </section>
            <section className="mb-5 rounded-xl bg-surface-alt p-3">
                <h3 className="mb-1 text-xs font-medium text-text-secondary">Disponibilidad Horaria</h3>
                <p className="text-sm font-medium text-text">{availabilityHours}</p>
            </section>           
            <div className="mt-auto border-t border-border pt-4">
                <button className="cursor-pointer w-full rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary/30">
                    Ver perfil
                </button>
            </div>
        </article>
    );
}