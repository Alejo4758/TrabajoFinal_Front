// Servicio de solicitudes de vinculación (cliente -> acompañante terapéutico)
// Por ahora simula el backend. Reemplazar el bloque de simulación por la llamada real
// Devuelve { status, error } igual que registerAT / registerClient, para manejarlo del mismo modo

const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:3000/api";

const wait = ms => new Promise (resolve => setTimeout (resolve, ms));

// payload = { description, locality, socialPrograms: string[], otherCoverage: boolean }
export async function sendLinkRequest (atId, payload) {
  // TODO (backend):
  // try {
  //   const res = await fetch(`${API_URL}/link-requests`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
  //     body: JSON.stringify({ atId: Number(atId), ...payload }), // el clientId debe salir del token, no del body
  //   });
  //   const data = await res.json().catch(() => ({}));
  //   return { status: res.status, error: data.message };
  // } catch {
  //   return { status: 500, error: 'No pudimos conectarnos con el servidor.' };
  // }
  void API_URL;

  // ---- Simulación ----
  await wait (900);

  // Para probar el error de solicitud repetida
  if (payload.description.includes ("[409]")) {
    return { status: 409, error: "Ya enviaste una solicitud a este profesional" };
  }
  return { status: 201 };
}