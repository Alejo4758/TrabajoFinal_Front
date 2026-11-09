// Servicio de solicitudes de vinculación (cliente -> acompañante terapéutico)
// Devuelve { status, data, error } igual que registerAT / registerClient, para manejarlo del mismo modo

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

// Hace el pedido autenticado y normaliza la respuesta a { status, data, error }
const request = async (path, token, options = {}) => {
  if (!BASE_URL) return { status: null, data: null, error: "La URL de la API no está configurada" };
  if (!token) return { status: 401, data: null, error: "Tenés que iniciar sesión para continuar" };

  try {
    const response = await fetch (`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get ("content-type") || "";

    const responseBody = contentType.includes ("application/json") ? await response.json () : null;

    if (response.ok) return { status: response.status, data: responseBody?.data ?? responseBody, error: null };

    return { status: response.status, data: null, error: responseBody?.message || responseBody?.error || `Error de backend: ${response.status}` };
  }
  catch {
    return { status: null, data: null, error: "Error de conexión con el backend. Intentá nuevamente" };
  }
};

// Envía la solicitud al backend. El backend la guarda y le manda una notificación al AT con los datos del caso
// payload = { patientId, description, locality, socialPrograms: string[], otherCoverage: boolean }
// patientId es la persona para la que se pide el acompañamiento: el backend verifica que sea una de las que cargó quien la envía.
// El cliente que envía la solicitud sale del token (no del body), así nadie puede mandarla en nombre de otro
export const sendLinkRequest = async (atId, payload, token) => {
  const body = {
    atId: Number (atId),
    patientId: Number (payload.patientId),
    description: payload.description,
    locality: payload.locality,
    socialPrograms: payload.socialPrograms,
    otherCoverage: payload.otherCoverage,
  };

  return request ("/link-requests", token, { method: "POST", body: JSON.stringify (body) }); // CAMBIAR POR EL ENDPOINT REAL DEL BACK
};

// Solicitudes que recibió el AT logueado (el AT sale del token). status: "PENDING" | "ACCEPTED" | "REJECTED"
export const getReceivedLinkRequests = async (token, status = "PENDING") =>
  request (`/link-requests/received?status=${encodeURIComponent (status)}`, token);

// El AT acepta o rechaza una solicitud. status: "ACCEPTED" | "REJECTED"
export const respondLinkRequest = async (requestId, status, token) =>
  request (`/link-requests/${encodeURIComponent (requestId)}`, token, { method: "PATCH", body: JSON.stringify ({ status }) });
