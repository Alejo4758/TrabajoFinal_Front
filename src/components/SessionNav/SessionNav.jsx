import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { NAV_LINKS } from "../../utils/constants";

// Acciones de la barra de navegación según la sesión. Solo se muestran los enlaces que el rol del usuario puede usar:
// ocultarlos no reemplaza a ProtectedRoute ni al backend, pero evita ofrecer accesos que van a ser rechazados
export default function SessionNav () {
    const { user, isAuthenticated, logout } = useAuth ();

    if (!isAuthenticated) return (
        <div className="flex items-center gap-3">
            <span className="hidden text-sm text-text-secondary md:inline">¿Ya tenés una cuenta?</span>
            <Link to="/login" className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary">
                Iniciar sesión
            </Link>
        </div>
    );

    const links = NAV_LINKS.filter (link => link.roles.includes (user.role));

    return (
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {links.map (link => (
                <Link key={link.to} to={link.to} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-text transition-colors hover:text-primary">
                    {link.label}
                </Link>
            ))}
            <button type="button" onClick={logout} className="cursor-pointer rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary">
                Cerrar sesión
            </button>
        </div>
    );
}
