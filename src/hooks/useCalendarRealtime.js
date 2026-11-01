import { useEffect, useRef } from "react";
import { subscribeToNotifications } from "../services/notificationService";

const CALENDAR_NOTIFICATIONS = ["INTERVIEW_REQUEST", "INTERVIEW_STATUS"];

// Llama a onChange cuando llega una notificación que modifica la agenda (nueva solicitud o cambio de estado de entrevista)
export const useCalendarRealtime = (userId, onChange) => {
  const callback = useRef (onChange);

  useEffect (() => {
    callback.current = onChange;
  }, [onChange]);

  useEffect (() => {
    if (!userId) return;

    return subscribeToNotifications (userId, notification => {
      if (CALENDAR_NOTIFICATIONS.includes (notification?.type)) callback.current ();
    });
  }, [userId]);
};
