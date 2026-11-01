import { formatRelativeTime } from "../utils/utils";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

const ACTIVITY_TYPES = {
  SESSION: "Sesión",
  INTERVIEW: "Entrevista",
  MEETING: "Reunión",
  OTHER: "Otro",
};

const fullName = person => [person?.name, person?.lastName].filter (Boolean).join (" ");

const isSameDay = (a, b) => a.getFullYear () === b.getFullYear () && a.getMonth () === b.getMonth () && a.getDate () === b.getDate ();

// "Hoy", "Mañana" o la fecha corta (ej: "mié 05/11")
const formatDay = date => {
  const today = new Date ();
  const tomorrow = new Date (today.getFullYear (), today.getMonth (), today.getDate () + 1);
  if (isSameDay (date, today)) return "Hoy";
  if (isSameDay (date, tomorrow)) return "Mañana";
  return new Intl.DateTimeFormat ("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" }).format (date).replace (",", "");
};

const formatTime = date => new Intl.DateTimeFormat ("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }).format (date);

const parseDate = value => {
  const date = value ? new Date (value) : null;
  return date && !Number.isNaN (date.getTime ()) ? date : null;
};

// Convierte la respuesta del backend al formato que muestra el Dashboard
const toDashboard = data => ({
  pendingRequests: Number (data?.pendingRequests) || 0,
  unreadMessages: Number (data?.unreadMessages) || 0,
  patients: (data?.patients ?? []).map (patient => {
    const lastActivity = parseDate (patient.lastActivity);
    const nextMeeting = parseDate (patient.nextMeeting);
    return {
      id: patient.id,
      name: fullName (patient),
      lastActivity: lastActivity ? formatRelativeTime (lastActivity) : "Sin actividad",
      status: "Activo",
      nextMeeting: nextMeeting ? `${formatDay (nextMeeting)} ${formatTime (nextMeeting)}` : null,
    };
  }),
  appointments: (data?.appointments ?? []).flatMap (appointment => {
    const start = parseDate (appointment.startDate);
    if (!start) return [];
    return [{
      id: appointment.id,
      day: formatDay (start),
      time: formatTime (start),
      patient: fullName (appointment.client),
      type: ACTIVITY_TYPES[appointment.type] ?? appointment.title ?? "Encuentro",
    }];
  }),
  notifications: (data?.notifications ?? []).map (notification => ({
    id: notification.id,
    text: notification.title,
    time: formatRelativeTime (notification.createdAt),
    unread: !notification.isRead,
  })),
});

// Datos de la pantalla de inicio del AT. El AT sale del token, por eso no se manda ningún id
// Lanza un Error con el mensaje para mostrar si algo falla
export const getATDashboard = async token => {
  if (!token) throw new Error ("Tenés que iniciar sesión para ver tu panel");

  let response;
  try {
    response = await fetch (`${BASE_URL}/at/me/dashboard`, { // CAMBIAR POR EL ENDPOINT REAL DEL BACK
      headers: { Authorization: `Bearer ${token}` },
    });
  }
  catch {
    throw new Error ("Error de conexión con el backend. Intentá nuevamente");
  }

  const contentType = response.headers.get ("content-type") || "";
  const responseBody = contentType.includes ("application/json") ? await response.json () : null;

  if (!response.ok) throw new Error (responseBody?.message || responseBody?.error || `Error de backend: ${response.status}`);

  return toDashboard (responseBody?.data ?? responseBody);
};
