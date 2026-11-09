 import { DAYS_OF_WEEK } from "./constants";
 
 export const calculateAge = dateOfBirth => {
    if (!dateOfBirth) return "--";        
    const birth = new Date (dateOfBirth);
    if (isNaN (birth.getTime ())) return "--";
    const today = new Date ();
    let age = today.getFullYear () - birth.getFullYear ();
    if (today.getMonth () < birth.getMonth () || (today.getMonth () === birth.getMonth () && today.getDate () < birth.getDate ())) age--;
    return age;
};

// "2022-03", "2022-03-01" o "2022-03-01T00:00:00.000Z" -> "mar 2022". Sin fecha es un trabajo actual.
// Se toman el año y el mes tal como vienen: con new Date, una fecha guardada el día 1 a las 00:00 UTC
// en Argentina todavía es el mes anterior y se mostraba "feb 2022"
export const formatMonthYear = dateString => {
    if (!dateString) return "Actualidad";
    const m = /^(\d{4})-(\d{2})/.exec (dateString);
    const date = m ? new Date (Number (m[1]), Number (m[2]) - 1, 1) : new Date (dateString);
    return date.toLocaleDateString ('es-AR', { month: 'short', year: 'numeric' }).replace ('.', '');
};

export const formatDateList = date => {
    if (!date) return "Fecha no disponible";
    
    const parsedDate = new Date (date);

    if (Number.isNaN (parsedDate.getTime ())) return "Fecha no disponible";

    return new Intl.DateTimeFormat ("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format (parsedDate);
}

export const formatDateDetail = date => {
    if (!date) return "No informado";

    const parsedDate = new Date(date);

    if (Number.isNaN (parsedDate.getTime ())) return "No informado";

    return new Intl.DateTimeFormat ("es-AR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format (parsedDate);
};

const RELATIVE_TIME_UNITS = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
];

export const formatRelativeTime = date => {
    if (!date) return "";

    const parsedDate = new Date (date);

    if (Number.isNaN (parsedDate.getTime ())) return "";

    const seconds = Math.trunc ((parsedDate.getTime () - Date.now ()) / 1000);
    const formatter = new Intl.RelativeTimeFormat ("es-AR", { numeric: "auto" });

    for (const [unit, unitSeconds] of RELATIVE_TIME_UNITS) {
        if (Math.abs (seconds) >= unitSeconds) return formatter.format (Math.trunc (seconds / unitSeconds), unit);
    }

    return "Recién";
};

// Días de la semana en el orden en que se muestran: de lunes a domingo (dayOfWeek: 0 = domingo ... 6 = sábado)
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// Disponibilidad horaria ([{ dayOfWeek, startTime, endTime }]) agrupada por día, de lunes a domingo y con las franjas
// ordenadas por hora: [{ dayOfWeek, day: "Lunes", ranges: [{ startTime, endTime }] }]. Solo los días que tienen horarios
export const availabilityByDay = (availability = []) => {
    if (!Array.isArray (availability)) return [];

    return WEEK_ORDER
        .map (dayOfWeek => ({
            dayOfWeek,
            day: DAYS_OF_WEEK[dayOfWeek],
            ranges: availability
                .filter (range => range?.dayOfWeek === dayOfWeek && range.startTime && range.endTime)
                .sort ((a, b) => a.startTime.localeCompare (b.startTime)),
        }))
        .filter (item => item.ranges.length > 0);
};

// "09:00" -> "9", "09:30" -> "9:30"
const formatHour = time => {
    const [hours, minutes] = time.split (":");
    return minutes === "00" ? String (Number (hours)) : `${Number (hours)}:${minutes}`;
};

// { startTime: "09:00", endTime: "13:30" } -> "9 a 13:30 h"
export const formatTimeRange = ({ startTime, endTime }) => `${formatHour (startTime)} a ${formatHour (endTime)} h`;

// ["Lunes", "miércoles", "viernes"] -> "Lunes, miércoles y viernes"
const joinWithAnd = items => (items.length <= 1 ? items.join ("") : `${items.slice (0, -1).join (", ")} y ${items.at (-1)}`);

// Días (dayOfWeek, en orden de lunes a domingo) -> "Lunes a viernes", "Lunes y miércoles", "Lunes a miércoles y viernes".
// Tres o más días seguidos se nombran como rango
const daysLabel = days => {
    const runs = [];
    days.forEach (dayOfWeek => {
        const position = WEEK_ORDER.indexOf (dayOfWeek);
        const run = runs.at (-1);
        if (run && WEEK_ORDER.indexOf (run.at (-1)) === position - 1) run.push (dayOfWeek);
        else runs.push ([dayOfWeek]);
    });

    const parts = runs.flatMap (run => (run.length >= 3
        ? [`${DAYS_OF_WEEK[run[0]]} a ${DAYS_OF_WEEK[run.at (-1)]}`]
        : run.map (dayOfWeek => DAYS_OF_WEEK[dayOfWeek])));
    const text = joinWithAnd (parts).toLowerCase ();

    return text.charAt (0).toUpperCase () + text.slice (1);
};

// Disponibilidad agrupada: los días que tienen exactamente los mismos horarios van juntos, en orden de lunes a domingo.
// [{ label: "Lunes a viernes", days: [1, 2, 3, 4, 5], ranges: [{ startTime, endTime }] }]
export const groupAvailability = (availability = []) => {
    const groups = [];

    availabilityByDay (availability).forEach (({ dayOfWeek, ranges }) => {
        const key = ranges.map (range => `${range.startTime}-${range.endTime}`).join (",");
        const group = groups.find (item => item.key === key);
        if (group) group.days.push (dayOfWeek);
        else groups.push ({ key, days: [dayOfWeek], ranges });
    });

    return groups.map (({ days, ranges }) => ({ label: daysLabel (days), days, ranges }));
};

// "Lunes a viernes: 9 a 13 h · Sábado: 10 a 12 h". Sin horarios: "A convenir"
export function formatAvailability (availability = []) {
    const groups = groupAvailability (availability);

    if (groups.length === 0) return "A convenir";

    return groups
        .map (({ label, ranges }) => `${label}: ${joinWithAnd (ranges.map (formatTimeRange))}`)
        .join (" · ");
}

export const normalize = text => text.normalize ("NFD").replace (/[\u0300-\u036f]/g, "").toLowerCase ();

export const initials = name => name.split (" ").slice (0, 2).map (word => word[0]).join ("").toUpperCase ();

// Nombre corto de una persona para las iniciales de su avatar: primer nombre y apellido.
// Con el nombre completo, initials tomaría las dos primeras palabras ("Ana María Paz" daría AM en vez de AP)
export const shortName = person => [person?.name?.trim ().split (" ")[0], person?.lastName].filter (Boolean).join (" ");

// Nombre completo de una persona ({ name, lastName }): usuario, paciente o acompañante
export const fullName = person => [person?.name, person?.lastName].filter (Boolean).join (" ");

// Edad en años a partir de una fecha "YYYY-MM-DD" (o ISO). Toma el día tal como está guardado, sin correrlo por la zona horaria.
// Devuelve null si no hay fecha: los pacientes creados al migrar datos anteriores no la tienen
export const ageFromDate = value => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec (value || "");
  if (!m) return null;
  const today = new Date ();
  const month = Number (m[2]) - 1;
  const day = Number (m[3]);
  let age = today.getFullYear () - Number (m[1]);
  if (today.getMonth () < month || (today.getMonth () === month && today.getDate () < day)) age--;
  return age >= 0 ? age : null;
};

export function formatDate(iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!m) return '—';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('es-AR', options);
}