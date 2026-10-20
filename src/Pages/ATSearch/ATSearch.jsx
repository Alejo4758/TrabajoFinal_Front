import { useATs } from "../../hooks/useATs";
import ATGrid from "../../components/ATGrid/ATGrid";
import FilterBar from "../../components/FilterBar/FilterBar";

export default function ATSearch () {
    const { ats, loading, error, hasMore, filters, loadMore, applyFilters } = useATs ();
    console.log (ats);

    return (
        <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-text">Encontrá un acompañante terapéutico</h2>
                    <p className="mt-2 text-text-secondary">Buscá profesionales según tu necesidad</p>
                </header>
                <FilterBar filters={filters} onApply={applyFilters} disabled={loading}/>
                <section>
                    <ATGrid ats={ats} loading={loading} error={error} />
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