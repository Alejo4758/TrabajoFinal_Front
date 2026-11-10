import { useATs } from "../../hooks/useATs";
import ATGrid from "../../components/ATGrid/ATGrid";
import FilterBar from "../../components/FilterBar/FilterBar";

// "6 profesionales mostrados" / "1 profesional encontrado"
function resultsSummary (count, hasMore, loading) {
    if (loading && count === 0) return "Buscando profesionales...";
    if (count === 0) return "";
    const noun = count === 1 ? "profesional" : "profesionales";
    const state = hasMore ? "mostrado" : "encontrado";
    return `${count} ${noun} ${count === 1 ? state : `${state}s`}`;
}

export default function ATSearch () {
    const { ats, loading, error, hasMore, filters, loadMore, applyFilters } = useATs ();

    return (
        <div className="min-h-page bg-background">
            <main className="px-4 pb-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <header className="py-10 sm:py-14">
                        <h2 className="text-pretty text-3xl font-extrabold leading-tight tracking-tight text-text sm:text-4xl lg:text-5xl">
                            Encontrá un <span className="text-primary">Acompañante{'\u00A0'}Terapéutico</span>
                        </h2>
                        <p className="text-pretty mt-4 text-base leading-7 text-text-secondary sm:text-lg">
                            Buscá profesionales según tu necesidad y consultá su perfil completo antes de enviar una solicitud
                        </p>
                    </header>

                    <section>
                        <FilterBar filters={filters} onApply={applyFilters} disabled={loading}/>
                    </section>

                    <section className="mt-10">
                        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-xl font-bold text-text">
                                Resultados
                            </h3>
                            <p className="text-sm text-text-muted">
                                {resultsSummary (ats.length, hasMore, loading)}
                            </p>
                        </div>

                        <ATGrid ats={ats} loading={loading} error={error} onRetry={() => applyFilters ({ ...filters })}/>

                        {hasMore && ats.length > 0 && (
                            <div className="mt-10 flex justify-center">
                                <button type="button" onClick={loadMore} disabled={loading} className="flex cursor-pointer items-center gap-2 rounded-xl border border-primary px-7 py-3 font-semibold 
                                                                                                       text-primary transition hover:bg-primary hover:text-white focus:outline-none focus-visible:ring-2 
                                                                                                       focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent 
                                                                                                       disabled:hover:text-primary">
                                    {loading && (
                                        <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3" />
                                            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    )}
                                    {loading ? "Cargando..." : "Cargar más"}
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}