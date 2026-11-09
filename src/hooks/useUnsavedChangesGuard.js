import { useEffect } from "react";

const MESSAGE = "Hay cambios sin guardar. Si salís ahora, se pierden. ¿Querés salir igual?";

// Avisa antes de que se pierdan cambios sin guardar. Mientras active es true:
//  - Al recargar, cerrar la pestaña o ir a otro sitio, el navegador muestra su propio aviso de confirmación (el texto lo pone él)
//  - Al hacer clic en un enlace interno de la app (pestañas, barra de navegación) se pide confirmación antes de navegar
// No cubre el botón "atrás" del navegador ni las navegaciones hechas por código (navigate): para eso hace falta useBlocker,
// que solo funciona con un data router (createBrowserRouter) y la app usa <BrowserRouter>
export const useUnsavedChangesGuard = active => {
    useEffect (() => {
        if (!active) return;

        const handleBeforeUnload = event => {
            event.preventDefault ();
            // Los navegadores anteriores a 2023 solo muestran el aviso si además se asigna returnValue
            event.returnValue = "";
        };

        const handleClick = event => {
            // Clic con Ctrl, Shift, etc. o con otro botón: abre en otra pestaña o ventana, esta página no se pierde
            if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;

            const link = event.target.closest?.("a[href]");

            if (!link || (link.target && link.target !== "_self") || link.hasAttribute ("download")) return;

            const url = new URL (link.href, window.location.href);

            // Un enlace a otro sitio descarga la página: de ese caso ya se ocupa beforeunload
            if (url.origin !== window.location.origin) return;

            // Un enlace a la página en la que ya está no desmonta nada
            if (url.pathname === window.location.pathname && url.search === window.location.search) return;

            if (window.confirm (MESSAGE)) return;

            // Se frena en la fase de captura, antes de que el clic llegue al enlace de React Router
            event.preventDefault ();
            event.stopPropagation ();
        };

        window.addEventListener ("beforeunload", handleBeforeUnload);
        document.addEventListener ("click", handleClick, true);

        return () => {
            window.removeEventListener ("beforeunload", handleBeforeUnload);
            document.removeEventListener ("click", handleClick, true);
        };
    }, [active]);
};
