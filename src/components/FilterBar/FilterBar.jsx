import { useEffect, useState } from "react";

export default function FilterBar ({ filters, onApply, disabled = false }) {
    const [form, setForm] = useState (filters);

    useEffect (() => { setForm (filters); }, [filters]);

    const handleChange = event => {
        const { name, value } = event.target;
        setForm ((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const handleSubmit = event => {
        event.preventDefault ();
        onApply (form);
    };

    const clearFilters = () => {
        const emptyFilters = {
            locality: "",
            specialties: "",
            socialPrograms: "",
        };
        setForm (emptyFilters);
        onApply (emptyFilters);
    };


    const LOCALITIES = [
        "Allen",
        "Centenario",
        "Cinco Saltos",
        "Cipolletti",
        "Fernández Oro",
        "General Roca",
        "Neuquén",
        "Plottier",
    ];

    const SPECIALTIES = [
        "Adultos",
        "Adolescencia",
        "Discapacidad",
        "Inclusión escolar",
        "Niñez",
        "Salud mental",
        "TEA",
        "Tercera edad",
    ];

    const SOCIAL_PROGRAMS = [
        "IOSFA",
        "IPROSS",
        "Medifé",
        "OSDE",
        "PAMI",
        "Swiss Medical",
    ];

    

    return (
        <form className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="locality">
                    Localidad
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary" id="locality" name="locality" value={form.locality} onChange={handleChange}>
                    <option value="">
                        Todas las localidades
                    </option>
                    {LOCALITIES.map (locality => (
                        <option key={locality} value={locality}>
                            {locality}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="specialties">
                    Especialidad
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary" id="specialties" name="specialties" value={form.specialties} onChange={handleChange}>
                    <option value="">
                        Todas las especialidades
                    </option>
                    {SPECIALTIES.map (specialty => (
                        <option key={specialty} value={specialty}>
                            {specialty}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="socialPrograms">
                    Obra social
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary" id="socialPrograms" name="socialPrograms" value={form.socialPrograms} onChange={handleChange}>
                    <option value="">
                        Todas las obras sociales
                    </option>
                    {SOCIAL_PROGRAMS.map (program => (
                        <option key={program} value={program}>
                            {program}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-end gap-2">
                <button className="flex-1 cursor-pointer rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={disabled}>
                    Buscar
                </button>
                <button className="cursor-pointer rounded-xl border border-border px-4 py-2.5 font-medium text-text transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={clearFilters} disabled={disabled}>
                    Limpiar
                </button>
            </div>
        </form>
    )
}