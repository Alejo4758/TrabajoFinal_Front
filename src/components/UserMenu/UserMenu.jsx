import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { PROFILE_LINKS, ROLE_LABELS } from "../../utils/constants";
import Avatar from "../Avatar/Avatar";
import Icon from "../Icon/Icon";

const ITEM = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium";

// Menú del usuario en la barra de navegación: el botón es su foto de perfil (o sus iniciales) y despliega las opciones
// de su cuenta, con "Cerrar sesión" al final. Como el resto de la barra, solo muestra las opciones que su rol puede usar
export default function UserMenu () {
    const { user, logout } = useAuth ();

    const [open, setOpen] = useState (false);
    const containerRef = useRef (null);
    const buttonRef = useRef (null);

    // Cerrar el menú al hacer clic afuera o al presionar Escape (igual que NotificationBell).
    useEffect (() => {
        if (!open) return;

        const handleClickOutside = event => {
            if (!containerRef.current?.contains (event.target)) setOpen (false);
        };
        const handleKeyDown = event => {
            if (event.key !== "Escape") return;

            setOpen (false);
            buttonRef.current?.focus ();
        };

        document.addEventListener ("mousedown", handleClickOutside);
        document.addEventListener ("keydown", handleKeyDown);

        return () => {
            document.removeEventListener ("mousedown", handleClickOutside);
            document.removeEventListener ("keydown", handleKeyDown);
        };
    }, [open]);

    const fullName = [user.name, user.lastName].filter (Boolean).join (" ");
    // Para las iniciales van el primer nombre y el apellido: con dos nombres, initials tomaría las dos primeras palabras
    const avatarName = [user.name?.trim ().split (" ")[0], user.lastName].filter (Boolean).join (" ");

    const links = PROFILE_LINKS.filter (link => link.roles.includes (user.role));

    return (
        <div ref={containerRef} className="relative">
            <button ref={buttonRef} type="button" onClick={() => setOpen (value => !value)} aria-haspopup="true" aria-expanded={open}
                aria-label={fullName ? `Menú de ${fullName}` : "Menú de usuario"} title="Mi cuenta"
                className="flex cursor-pointer rounded-full transition hover:ring-2 hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                <Avatar image={user.image} name={avatarName} className="size-10 sm:size-11"/>
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-primary/5">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                        <Avatar image={user.image} name={avatarName}/>
                        <div className="min-w-0">
                            <p className="m-0 truncate text-sm font-semibold text-text">{fullName || "Mi cuenta"}</p>
                            <p className="m-0 truncate text-xs text-text-secondary">{user.email || ROLE_LABELS[user.role]}</p>
                        </div>
                    </div>

                    <ul className="m-0 list-none p-2">
                        {links.map (link => (
                            <li key={link.label}>
                                {link.to ? (
                                    <Link to={link.to} onClick={() => setOpen (false)} className={`${ITEM} text-text transition-colors hover:bg-surface-alt hover:text-primary`}>
                                        <Icon name={link.icon}/>
                                        {link.label}
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className={`${ITEM} cursor-not-allowed text-text-disabled`}>
                                        <Icon name={link.icon}/>
                                        <span className="flex-1">{link.label}</span>
                                        <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] text-text-muted">Próximamente</span>
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-border p-2">
                        <button type="button" onClick={logout} className={`${ITEM} cursor-pointer text-danger transition-colors hover:bg-danger-light`}>
                            <Icon name="logout"/>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
