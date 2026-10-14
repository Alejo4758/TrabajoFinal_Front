import { useEffect, useState } from "react";
import { useATs } from "../../hooks/useATs";
import ATCard from "../ATCard/ATCard";

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

export default function ATSearchPage() {
    const { ats, loading, error, hasMore, filters, loadMore, applyFilters } = useATs ();

    const [form, setForm] = useState (filters);

    useEffect (() => { setForm (filters); }, [filters]);

    const handleChange = event => {
        const { name, value } = event.target;

        setForm ((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = event => {
        event.preventDefault ();
        applyFilters (form);
    };

    const clearFilters = () => {
        const emptyFilters = {
            locality: "",
            specialties: "",
            socialPrograms: "",
        };

        setForm (emptyFilters);
        applyFilters (emptyFilters);
    };

    return (
        <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-text">Encontrá un acompañante terapéutico</h2>
                    <p className="mt-2 text-text-secondary">Buscá profesionales según tu necesidad</p>
                </header>
                <form className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text" htmlFor="locality">Localidad</label>
                        <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary" id="locality" name="locality" value={form.locality} onChange={handleChange}>
                            <option value="">Todas las localidades</option>
                            {LOCALITIES.map (locality => (
                                <option key={locality} value={locality}>{locality}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text" htmlFor="specialties">Especialidad</label>
                        <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary" id="specialties" name="specialties" value={form.specialties} onChange={handleChange}>
                            <option value="">Todas las especialidades</option>
                            {SPECIALTIES.map (specialty => (
                                <option key={specialty} value={specialty}>{specialty}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-text" htmlFor="socialPrograms">Obra social</label>
                        <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary" id="socialPrograms" name="socialPrograms" value={form.socialPrograms} onChange={handleChange}>
                            <option value="">Todas las obras sociales</option>
                            {SOCIAL_PROGRAMS.map(program => (
                                <option key={program} value={program}>{program}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button className="flex-1 cursor-pointer rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>
                            Buscar
                        </button>
                        <button className="cursor-pointer rounded-xl border border-border px-4 py-2.5 font-medium text-text transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={clearFilters} disabled={loading}>
                            Limpiar
                        </button>
                    </div>
                </form>

                <section>
                    <div className="mb-5">
                        <h2 className="text-xl font-semibold text-text">Acompañantes disponibles</h2>
                        {!loading && ats.length > 0 && (
                            <p className="mt-1 text-sm text-text-secondary">
                                {ats.length} profesionales encontrados
                                en los resultados cargados.
                            </p>
                        )}
                    </div>

                    {error && (<div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">{error}</div>)}

                    {loading && ats.length === 0 && !error && (<p className="py-10 text-center text-text-secondary">Buscando...</p>)}

                    {!loading && !error && ats.length === 0 && (
                        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                            <h3 className="font-semibold text-text">No se encontraron profesionales</h3>
                        </div>
                    )}

                    {ats.length > 0 && (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {ats.map (at => (
                                <ATCard key={at.id} {...at}/>
                            ))}
                        </div>
                    )}

                    {hasMore && ats.length > 0 && (
                        <div className="mt-8 flex justify-center">
                            <button className="cursor-pointer rounded-xl border border-primary px-6 py-3 font-semibold text-primary transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={loadMore} disabled={loading}>
                                {loading ? "Cargando..." : "Cargar más"}
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}