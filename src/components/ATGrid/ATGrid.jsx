import ATCard from '../ATCard/ATCard';

export default function ATGrid ({ ats, loading, error }) {
    if (error) {
        return (
            <div className="flex justify-center py-10 w-full">
                <div className="w-full max-w-2xl rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-600">
                    <h3 className="font-semibold text-lg mb-1">
                        Ocurrió un problema
                    </h3>
                    <p className="text-sm">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    if (!ats || ats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 w-full">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary"/>
                        <p className="text-lg font-medium text-text-secondary tracking-wide">
                            Buscando profesionales...
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-surface p-12 text-center w-full max-w-2xl">
                        <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <h3 className="text-xl font-semibold text-text mb-2">
                            No se encontraron profesionales
                        </h3>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {ats.map (at => (
                <ATCard key={at.id} {...at}/>
            ))}
        </div>
    );
}