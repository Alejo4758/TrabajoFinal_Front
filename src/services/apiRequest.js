// Pedidos al backend de la red de apoyo y los aportes.
// El back responde { data } si sale bien y { error, code, details? } si falla. Los errores se lanzan con code y details,
// que es lo que miran los componentes (por ejemplo err.code === "duplicate").

import { getSession } from "./authService";

const BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");

// Código por defecto cuando la respuesta no trae uno (por ejemplo, el 403 del middleware de roles)
const STATUS_CODES = { 400: "invalid", 401: "forbidden", 403: "forbidden", 404: "not_found", 409: "duplicate", 410: "expired", 429: "rate_limited" };

export const fail = (message, code, details) => Object.assign(new Error(message), { code, details });

// Devuelve el cuerpo completo de la respuesta ({ data, ... }). auth = false para las páginas públicas de la invitación
export async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getSession()?.token;
    if (!token) throw fail("Tenés que iniciar sesión para continuar.", "forbidden");
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw fail("Error de conexión con el backend. Intentá nuevamente.", "network");
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw fail(
      payload?.error || payload?.message || `Error del servidor (${response.status}). Intentá nuevamente.`,
      payload?.code ?? STATUS_CODES[response.status] ?? "server",
      payload?.details
    );
  }

  return payload ?? {};
}
