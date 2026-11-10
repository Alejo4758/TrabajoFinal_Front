// Servicio de encuentros: el historial de un paciente y el registro de uno nuevo.
// Los encuentros son del acompañamiento entre ese paciente y el AT logueado (el AT sale del token).
// Igual que planService, las funciones lanzan un Error con el mensaje para mostrar si algo falla.
//
// Forma de un encuentro (la que usan las pestañas Encuentros y Evolución):
// {
//   id, date: "YYYY-MM-DD", time: "HH:MM",       // fecha y hora de inicio en Argentina
//   startDate,                                    // el mismo inicio como instante ISO
//   duration,                                     // minutos
//   stageId, stageName,                           // ámbito del plan en el que se trabajó
//   goalIds: string[],
//   goals: [{ goalId, goalText, level, note }],   // level de 1 a 5 (utils/scale.js)
//   activities: string[], observations,
//   calendarActivityId,                           // sesión del calendario donde quedó registrado
//   createdAt
// }

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

// Orden cronológico de los encuentros: por fecha, después por hora y, si coinciden, por id (numérico: 10 va después de 9).
// Para ordenar del más reciente al más antiguo: sessions.sort ((a, b) => compareSessions (b, a))
export const compareSessions = (a, b) =>
    a.date.localeCompare (b.date) ||
    (a.time ?? "").localeCompare (b.time ?? "") ||
    String (a.id).localeCompare (String (b.id), undefined, { numeric: true });

const encountersUrl = patientId => `${BASE_URL}/api/at/patients/${encodeURIComponent (patientId)}/encounters`;

const request = async (url, token, options, fallbackError) => {
    if (!token) throw new Error ("Tenés que iniciar sesión para continuar");

    let res;
    try {
        res = await fetch (url, {
            ...options,
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                Authorization: `Bearer ${token}`,
            },
        });
    }
    catch {
        throw new Error ("Error de conexión con el backend. Intentá nuevamente");
    }

    const body = await res.json ().catch (() => null);

    if (!res.ok) throw new Error (body?.message || body?.error || fallbackError);

    return body?.data ?? body;
};

// Historial de encuentros del paciente, del más reciente al más antiguo
export async function getSessions (patientId, token) {
    const sessions = await request (encountersUrl (patientId), token, {}, "No pudimos cargar los encuentros.");
    return Array.isArray (sessions) ? sessions : [];
}

// Registra un encuentro y devuelve el encuentro guardado, con su id. El backend también lo agrega al calendario
// y responde 409 si el paciente ya tiene un encuentro en esa fecha y hora.
// Solo se mandan los ids del ámbito y de los objetivos: el backend toma los textos del plan y valida que sean de ese plan
export async function createSession (patientId, session, token) {
    if (!patientId) throw new Error ("No se pudo identificar al paciente.");

    const payload = {
        date: session.date,
        time: session.time,
        duration: session.duration,
        stageId: session.stageId,
        goals: (session.goals ?? []).map (goal => ({ goalId: goal.goalId, level: goal.level, note: goal.note ?? "" })),
        activities: session.activities ?? [],
        observations: session.observations ?? "",
    };

    return request (encountersUrl (patientId), token, { method: "POST", body: JSON.stringify (payload) }, "No pudimos registrar el encuentro.");
}
