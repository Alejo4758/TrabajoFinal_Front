import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "../../hooks/useNotifications";
import { getSession } from "../../services/authService";
import { formatRelativeTime } from "../../utils/utils";
import Icon from "../Icon/Icon";

// Ícono según el tipo de notificación (enum NotificationType del backend).
const TYPE_ICONS = {
    CHAT_MESSAGE: "chat",
    INTERVIEW_REQUEST: "calendar",
    INTERVIEW_STATUS: "calendar",
    PROFILE_VALIDATED: "shield",
};

export default function NotificationBell () {
    const navigate = useNavigate ();
    const userId = getSession ()?.user.id;

    const { notifications, unreadCount, loading, error, reload, markAsRead, markAllAsRead } = useNotifications (userId);
    const [open, setOpen] = useState (false);
    const containerRef = useRef (null);

    // Cerrar el panel al hacer clic afuera o al presionar Escape.
    useEffect (() => {
        if (!open) return;

        const handleClickOutside = event => {
            if (!containerRef.current?.contains (event.target)) setOpen (false);
        };
        const handleKeyDown = event => {
            if (event.key === "Escape") setOpen (false);
        };

        document.addEventListener ("mousedown", handleClickOutside);
        document.addEventListener ("keydown", handleKeyDown);

        return () => {
            document.removeEventListener ("mousedown", handleClickOutside);
            document.removeEventListener ("keydown", handleKeyDown);
        };
    }, [open]);

    if (!userId) return null;

    const handleSelect = notification => {
        if (!notification.isRead) markAsRead (notification.id);

        setOpen (false);

        if (notification.link) navigate (notification.link);
    };

    return (
        <div ref={containerRef} className="relative">
            <button type="button" onClick={() => setOpen (value => !value)} aria-haspopup="true" aria-expanded={open}
                aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
                className="relative flex size-11 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface text-text-secondary transition-colors hover:border-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
                <Icon name="bell"/>
                {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white" aria-hidden="true">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl shadow-primary/5">
                    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                        <h2 className="text-sm font-semibold text-text">Notificaciones</h2>
                        {unreadCount > 0 && (
                            <button type="button" onClick={markAllAsRead} className="cursor-pointer text-xs font-medium text-primary hover:underline">
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    {error && (
                        <div role="alert" className="flex items-center justify-between gap-3 border-b border-red-200 bg-danger-light px-4 py-2 text-xs text-danger">
                            <span>{error}</span>
                            <button type="button" onClick={reload} className="shrink-0 cursor-pointer font-semibold hover:underline">
                                Reintentar
                            </button>
                        </div>
                    )}

                    <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                        {loading && notifications.length === 0 && (
                            <li className="p-6 text-center text-sm text-text-secondary">Cargando notificaciones...</li>
                        )}
                        {!loading && !error && notifications.length === 0 && (
                            <li className="p-6 text-center text-sm text-text-secondary">No tenés notificaciones</li>
                        )}
                        {notifications.map (notification => (
                            <li key={notification.id}>
                                <button type="button" onClick={() => handleSelect (notification)}
                                    className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-alt ${notification.isRead ? "" : "bg-primary/5"}`}
                                >
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <Icon name={TYPE_ICONS[notification.type] ?? "bell"} className="h-4 w-4"/>
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className={`block truncate text-sm ${notification.isRead ? "font-medium text-text-secondary" : "font-semibold text-text"}`}>
                                            {notification.title}
                                        </span>
                                        <span className="mt-0.5 line-clamp-2 text-xs text-text-secondary">
                                            {notification.content}
                                        </span>
                                        <span className="mt-1 block text-[11px] text-text-muted">
                                            {formatRelativeTime (notification.createdAt)}
                                        </span>
                                    </span>
                                    {!notification.isRead && (
                                        <>
                                            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true"/>
                                            <span className="sr-only">Sin leer</span>
                                        </>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
