// Este servicio NO está simulado: pide los datos al backend, porque el plan y los
// encuentros ya los tenemos ahí. Hasta que tengamos los endpoints, el tablero se prueba desde la vista previa del AT
// (Red de apoyo → "Ver su tablero"), que usa los datos reales del paciente.

const BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

const request = async (path, token) => {
  if (!token) throw new Error("Tenés que iniciar sesión para continuar");

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error("Error de conexión con el backend. Intentá nuevamente");
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;

  if (response.status === 403) throw new Error("No formás parte de la red de apoyo de este acompañamiento, o tu acceso fue revocado");
  if (response.status === 404) throw new Error("No encontramos ese acompañamiento");
  if (!response.ok) throw new Error(body?.message || body?.error || `Error de backend: ${response.status}`);

  return body?.data ?? body;
};

export const getMyNetworks = (token) => request("/api/network/patients", token);

export const getBoard = (patientId, token) =>
  request(`/api/network/patients/${encodeURIComponent(patientId)}/board`, token);
