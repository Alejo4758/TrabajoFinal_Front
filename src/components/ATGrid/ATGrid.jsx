import ATCard from '../ATCard/ATCard';

const SKELETON_COUNT = 6;
const GRID_CLASS = "grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3";

function SkeletonCard () {
    return (
        <div className="flex h-full animate-pulse flex-col rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-4">
                <div className="size-16 shrink-0 rounded-full bg-surface-alt"/>
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-surface-alt"/>
                    <div className="h-3 w-1/3 rounded bg-surface-alt"/>
                </div>
            </div>
            <div className="mt-6 space-y-5">
                {[0, 1, 2].map (index => (
                    <div key={index} className="space-y-2">
                        <div className="h-3 w-1/4 rounded bg-surface-alt"/>
                        <div className="flex gap-2">
                            <div className="h-6 w-20 rounded-lg bg-surface-alt"/>
                            <div className="h-6 w-24 rounded-lg bg-surface-alt"/>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 h-14 rounded-xl bg-surface-alt"/>
            <div className="mt-5 h-11 rounded-xl bg-surface-alt"/>
        </div>
    )
}

export default function ATGrid ({ ats, loading, error, onRetry }) {
    if (error) {
        return (
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-600">
                <h3 className="mb-1 text-lg font-semibold">
                    Ocurrió un problema
                </h3>
                <p className="text-sm">
                    {error}
                </p>
                {onRetry && (
                    <button type="button" onClick={onRetry} className="mt-5 cursor-pointer rounded-xl border border-red-500/40 bg-surface
                                                                       px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 focus:outline-none
                                                                       focus-visible:ring-2 focus-visible:ring-red-500/30">
                        Reintentar
                    </button>
                )}
            </div>
        );
    }

    if (!ats || ats.length === 0) {
        if (loading) {
            return (
                <div className={GRID_CLASS}>
                    {Array.from ({ length: SKELETON_COUNT }, (_, index) => (
                        <SkeletonCard key={index}/>
                    ))}
                </div>
            );
        }

        return (
            <div className="mx-auto w-full max-w-2xl rounded-2xl border border-dashed border-border bg-surface p-10 text-center sm:p-14">
                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
                    <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                </div>
                <h3 className="mb-2 text-xl font-bold text-text">
                    No se encontraron profesionales
                </h3>
                <p className="mx-auto max-w-sm text-sm text-text-secondary text-pretty">
                    Probá con otra zona o quitá algún filtro para ampliar la búsqueda
                </p>
            </div>
        );
    }

    return (
        <ul className={`${GRID_CLASS} w-full m-0 list-none p-0`}>
            {ats.map (at => (
                <li key={at.id} className="flex">
                    <ATCard {...at}/>
                </li>
            ))}
        </ul>
    );
}