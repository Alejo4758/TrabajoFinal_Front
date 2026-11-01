// Pantalla de espera a pantalla completa mientras se resuelve lo necesario para mostrar una página
export default function LoadingScreen () {
    return (
        <main role="status" className="flex min-h-screen items-center justify-center bg-background">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary" aria-hidden="true"/>
            <span className="sr-only">Cargando…</span>
        </main>
    );
}
