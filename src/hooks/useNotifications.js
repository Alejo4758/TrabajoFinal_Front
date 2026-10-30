import { useState, useEffect, useCallback } from "react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, subscribeToNotifications } from "../services/notificationService";

export const useNotifications = userId => {
    // Lista y contador van juntos para actualizarlos en un único paso.
    const [state, setState] = useState ({ notifications: [], unreadCount: 0 });
    const [loading, setLoading] = useState (Boolean (userId));
    const [error, setError] = useState (null);

    const applyResult = useCallback (result => {
        if (result.error) {
            setError (result.error);
        }
        else {
            setState (result.data);
            setError (null);
        }

        setLoading (false);
    }, []);

    useEffect (() => {
        if (!userId) return;

        let cancelled = false;

        getNotifications (userId).then (result => {
            if (!cancelled) applyResult (result);
        });

        return () => {
            cancelled = true;
        };
    }, [userId, applyResult]);

    useEffect (() => {
        if (!userId) return;

        return subscribeToNotifications (userId, notification => {
            setState (previous => {
                if (previous.notifications.some (item => item.id === notification.id)) return previous;

                return {
                    notifications: [notification, ...previous.notifications],
                    unreadCount: previous.unreadCount + (notification.isRead ? 0 : 1),
                };
            });
        });
    }, [userId]);

    const reload = useCallback (async () => {
        if (!userId) return;

        setLoading (true);
        setError (null);

        applyResult (await getNotifications (userId));
    }, [userId, applyResult]);

    const markAsRead = useCallback (async notificationId => {
        const result = await markNotificationAsRead (notificationId);

        if (result.error) {
            setError (result.error);
            return;
        }

        setState (previous => {
            const target = previous.notifications.find (item => item.id === notificationId);

            if (!target || target.isRead) return previous;

            return {
                notifications: previous.notifications.map (item => item.id === notificationId ? { ...item, isRead: true } : item),
                unreadCount: Math.max (0, previous.unreadCount - 1),
            };
        });
    }, []);

    const markAllAsRead = useCallback (async () => {
        if (!userId) return;

        const result = await markAllNotificationsAsRead (userId);

        if (result.error) {
            setError (result.error);
            return;
        }

        setState (previous => ({
            notifications: previous.notifications.map (item => ({ ...item, isRead: true })),
            unreadCount: 0,
        }));
    }, [userId]);

    return { notifications: state.notifications, unreadCount: state.unreadCount, loading, error, reload, markAsRead, markAllAsRead };
};
