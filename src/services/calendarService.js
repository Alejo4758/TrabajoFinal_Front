// Servicio del calendario y la agenda. Todas las funciones devuelven { data, error }.
// Cuando el backend responde 409 (superposición horaria) devuelven además { warning, conflictingActivity } para que
// el formulario pueda ofrecer "Guardar de todos modos". El dueño de la agenda sale del token, nunca del body

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

const getToken = () => {
  try {
    const token = localStorage.getItem ("token");
    if (token) return token;
    return JSON.parse (localStorage.getItem ("user") || "null")?.token ?? null;
  }
  catch {
    return null;
  }
};

// Hace el pedido autenticado y devuelve { status, body }. Nunca lanza: los errores de red salen como status null
const request = async (path, options = {}) => {
  const token = getToken ();

  if (!token) return { status: 401, body: { message: "Tenés que iniciar sesión para continuar" } };

  try {
    const response = await fetch (`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get ("content-type") || "";
    const body = contentType.includes ("application/json") ? await response.json ().catch (() => null) : null;

    return { status: response.status, body };
  }
  catch {
    return { status: null, body: null };
  }
};

const errorMessage = ({ status, body }) => {
  if (status === null) return "Error de conexión con el servidor. Intentá nuevamente";
  if (status === 401) return "Tu sesión venció. Volvé a iniciar sesión";
  if (status === 403) return "No tenés permiso para realizar esta acción";
  const message = body?.message || body?.error;
  return typeof message === "string" ? message : `Error del servidor (${status})`;
};

const isOk = status => status !== null && status >= 200 && status < 300;

const toList = body => {
  const list = Array.isArray (body) ? body : body?.data ?? body?.activities ?? body?.clients ?? body?.holidays;
  return Array.isArray (list) ? list : [];
};

const fetchList = async path => {
  const result = await request (path);
  if (!isOk (result.status)) return { data: [], error: errorMessage (result) };
  return { data: toList (result.body), error: null };
};

// Escritura con manejo del 409
const write = async (path, method, payload) => {
  const result = await request (path, { method, body: JSON.stringify (payload) });

  if (result.status === 409) {
    return {
      data: null,
      warning: result.body?.message || "La actividad se superpone con otra",
      conflictingActivity: result.body?.conflictingActivity ?? null,
      error: null,
    };
  }

  if (!isOk (result.status)) return { data: null, warning: null, conflictingActivity: null, error: errorMessage (result) };

  return { data: result.body?.data ?? result.body, warning: null, conflictingActivity: null, error: null };
};

// Agenda del AT autenticado entre dos fechas (ISO)
export const getMyATCalendar = ({ start, end, includeCancelled = false } = {}) => {
  const params = new URLSearchParams ();
  if (start) params.set ("start", start);
  if (end) params.set ("end", end);
  params.set ("includeCancelled", String (includeCancelled));
  return fetchList (`/api/calendar/me?${params}`);
};

export const getMyClientCalendar = () => fetchList ("/api/calendar/client/me");

// Clientes vinculados al AT, para el selector de paciente
export const getATLinkedClients = () => fetchList ("/api/calendar/clients");

// Feriados nacionales (el backend consulta ArgentinaDatos)
export const getHolidaysByYear = year => fetchList (`/api/calendar/holidays/${encodeURIComponent (year)}`);

export const createCalendarActivity = payload => write ("/api/calendar", "POST", payload);

export const updateCalendarActivity = (id, payload) => write (`/api/calendar/${encodeURIComponent (id)}`, "PATCH", payload);

// payload = { profileATId, startDate, finishDate, message }
export const requestInterview = async payload => {
  const result = await write ("/api/calendar/interview-request", "POST", payload);
  // Una entrevista que choca con la agenda del AT la resuelve el AT: para el cliente un 409 es un error común
  if (result.warning) return { data: null, error: result.warning };
  return { data: result.data, error: result.error };
};
