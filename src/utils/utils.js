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