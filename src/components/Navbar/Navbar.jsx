import { Link, NavLink } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { NAV_LINKS, ROLE_ROUTES, DEFAULT_ROUTE } from "../../utils/constants";
import BrandMark from "../BrandMark/BrandMark";
import Icon from "../Icon/Icon";
import NotificationBell from "../NotificationBell/NotificationBell";
import UserMenu from "../UserMenu/UserMenu";

const ICON_BUTTON = "grid size-10 place-items-center rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 sm:size-11";
const ICON_BUTTON_IDLE = "text-text-secondary hover:bg-surface-alt hover:text-primary";
const ICON_BUTTON_ACTIVE = "bg-primary/10 text-primary";

// Barra de navegación de las páginas con sesión (la monta AppLayout). Muestra solo los íconos de las páginas que el rol del usuario
// puede usar: ocultarlos no reemplaza a ProtectedRoute ni al backend, pero evita ofrecer accesos que van a ser rechazados
export default function Navbar () {
    const { user } = useAuth ();

    const links = NAV_LINKS.filter (link => link.roles.includes (user.role));

    return (
        // El alto va en el header para que incluya el borde: así la barra mide exactamente lo que descuentan h-page y min-h-page
        <header className="sticky top-0 z-40 h-navbar border-b border-border bg-surface">
            <div className="mx-auto flex h-full max-w-7xl items-center gap-1 px-4 sm:gap-2 sm:px-6 lg:px-8">
                {/* En pantallas muy angostas se oculta el logo para que entren todos los íconos */}
                <Link to={ROLE_ROUTES[user.role] ?? DEFAULT_ROUTE} aria-label="RedAT, ir a mi inicio" className="hidden items-center gap-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-[360px]:flex">
                    <BrandMark className="h-10 w-10"/>
                    <span className="hidden text-xl font-extrabold tracking-tight text-text sm:block">RedAT</span>
                </Link>
                {/* Todo lo demás va a la derecha: páginas, notificaciones y, al final, el menú del usuario */}
                <nav aria-label="Navegación principal" className="ml-auto">
                    <ul className="m-0 flex list-none items-center gap-1 p-0 sm:gap-2">
                        {links.map (link => (
                            <li key={link.to}>
                                {/* Como el enlace es solo un ícono, el nombre de la página va en aria-label (lectores de pantalla) y en title (al pasar el mouse) */}
                                <NavLink to={link.to} aria-label={link.label} title={link.label} className={({ isActive }) => `${ICON_BUTTON} ${isActive ? ICON_BUTTON_ACTIVE : ICON_BUTTON_IDLE}`}>
                                    <Icon name={link.icon}/>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true"/>
                <NotificationBell/>
                <UserMenu/>
            </div>
        </header>
    );
}
