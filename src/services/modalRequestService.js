// Servicio de solicitudes de vinculación (cliente -> acompañante terapéutico)
// Devuelve { status, data, error } igual que registerAT / registerClient, para manejarlo del mismo modo

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

// Envía la solicitud al backend. El backend la guarda y le manda una notificación al AT con los datos del caso
// payload = { description, locality, socialPrograms: string[], otherCoverage: boolean }
// El cliente que envía la solicitud sale del token (no del body), así nadie puede mandarla en nombre de otro
export const sendLinkRequest = async (atId, payload, token) => {
  if (!BASE_URL) return { status: null, data: null, error: "La URL de la API no está configurada" };
  if (!token) return { status: 401, data: null, error: "Tenés que iniciar sesión para enviar una solicitud" };

  const body = {
    atId: Number (atId),
    description: payload.description,
    locality: payload.locality,
    socialPrograms: payload.socialPrograms,
    otherCoverage: payload.otherCoverage,
  };

  try {
    const response = await fetch (`${BASE_URL}/link-requests`, { // CAMBIAR POR EL ENDPOINT REAL DEL BACK
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify (body),
    });

    const contentType = response.headers.get ("content-type") || "";

    const responseBody = contentType.includes ("application/json") ? await response.json () : null;

    if (response.ok) return { status: response.status, data: responseBody, error: null };

    return { status: response.status, data: null, error: responseBody?.message || responseBody?.error || `Error de backend: ${response.status}` };
  }
  catch {
    return { status: null, data: null, error: "Error de conexión con el backend. Intentá nuevamente" };
  }
};
