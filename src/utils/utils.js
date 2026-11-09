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

export const formatMonthYear = dateString => {
    if (!dateString) return "Actualidad";
    const date = new Date (dateString);
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

export function formatAvailability (availability = []) {
    if (!Array.isArray(availability) || availability.length === 0) return "A convenir";

    const groupedDays = new Map ();

    availability.forEach (({ dayOfWeek, startTime, endTime }) => {
        const day = DAYS_OF_WEEK[dayOfWeek];

        if (dayOfWeek == null || !day || !startTime || !endTime) return;

        if (!groupedDays.has (day)) groupedDays.set (day, []);

        groupedDays.get(day).push(`${startTime} a ${endTime}`);
    });

    if (groupedDays.size === 0) return "A convenir";

    return [...groupedDays.entries()]
        .map (([day, hours]) => `${day}: ${hours.join (", ")}`)
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