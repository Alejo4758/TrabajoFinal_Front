// Constantes y helpers de fechas del calendario. Se trabaja siempre en hora local del navegador

export const ACTIVITY_TYPES = {
  SESSION: { label: "Sesión", pill: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
  INTERVIEW: { label: "Entrevista", pill: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  MEETING: { label: "Reunión", pill: "bg-violet-100 text-violet-800 border-violet-200", dot: "bg-violet-500" },
  OTHER: { label: "Recordatorio", pill: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
};

export const ACTIVITY_STATES = {
  PENDING: { label: "Pendiente", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmada", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  COMPLETED: { label: "Completada", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Cancelada", badge: "bg-red-50 text-red-700 border-red-200" },
};

export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Solo strings y números llegan a pantalla: nunca se renderiza un objeto crudo
export const safeText = value => (typeof value === "string" || typeof value === "number" ? String (value) : "");

export const fullName = person => [person?.name, person?.lastName].map (safeText).filter (Boolean).join (" ");

const pad = n => String (n).padStart (2, "0");

export const dateKey = date => `${date.getFullYear ()}-${pad (date.getMonth () + 1)}-${pad (date.getDate ())}`;

export const timeValue = date => `${pad (date.getHours ())}:${pad (date.getMinutes ())}`;

export const parseDate = value => {
  const date = value ? new Date (value) : null;
  return date && !Number.isNaN (date.getTime ()) ? date : null;
};

// "2026-11-01" + "09:30" -> Date local (null si es inválida)
export const combineDateTime = (date, time) => {
  const result = new Date (`${date}T${time}`);
  return Number.isNaN (result.getTime ()) ? null : result;
};

export const formatTime = value => {
  const date = parseDate (value);
  return date ? timeValue (date) : "";
};

export const formatLongDate = date => new Intl.DateTimeFormat ("es-AR", { weekday: "long", day: "numeric", month: "long" }).format (date);

export const formatMonth = date => new Intl.DateTimeFormat ("es-AR", { month: "long", year: "numeric" }).format (date);

export const formatDateTime = value => {
  const date = parseDate (value);
  return date ? new Intl.DateTimeFormat ("es-AR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format (date) : "";
};

// 42 días (6 semanas) empezando en lunes que cubren el mes
export const buildMonthGrid = viewDate => {
  const first = new Date (viewDate.getFullYear (), viewDate.getMonth (), 1);
  const offset = (first.getDay () + 6) % 7;
  return Array.from ({ length: 42 }, (_, i) => new Date (first.getFullYear (), first.getMonth (), 1 - offset + i));
};

// Normaliza la lista de feriados (ArgentinaDatos usa fecha/nombre) a { "YYYY-MM-DD": nombre }
export const holidaysToMap = list => {
  const map = {};
  for (const holiday of list ?? []) {
    const key = safeText (holiday?.fecha ?? holiday?.date).slice (0, 10);
    const name = safeText (holiday?.nombre ?? holiday?.name ?? holiday?.localName);
    if (key) map[key] = name || "Feriado";
  }
  return map;
};

export const sortByStart = list => [...list].sort ((a, b) => (parseDate (a.startDate)?.getTime () ?? 0) - (parseDate (b.startDate)?.getTime () ?? 0));
