
const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Realiza una petición HTTP a la API de RedAT.
 * Incluye el token de autenticación almacenado durante el login.
 */
async function request(path, options = {}) {
  if (!BASE_URL) {
    throw new Error(
      "No está configurada la URL de la API. Revisá VITE_API_URL."
    );
  }

  const token = localStorage.getItem("token");

  const headers = {
    Accept: "application/json",
    ...(options.body
      ? { "Content-Type": "application/json" }
      : {}),
    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...options.headers,
  };

  const url = `${BASE_URL.replace(/\/+$/, "")}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Permite manejar respuestas JSON y respuestas sin contenido.
  const responseText = await response.text();

  let result = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }
  }

  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null
        ? result.message || result.error
        : null;

    throw new Error(
      message ||
        `Error al comunicarse con el servidor (${response.status}).`
    );
  }

  return result;
}

/**
 * Normaliza la respuesta de una consulta de perfiles.
 * Admite un arreglo directo o un arreglo dentro de "data" o "profiles".
 */
function extractProfiles(result) {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (Array.isArray(result?.profiles)) {
    return result.profiles;
  }

  throw new Error(
    "La respuesta del servidor no tiene el formato esperado."
  );
}

/**
 * Obtiene los perfiles de AT pendientes de validación.
 */
export async function getPendingATProfiles() {
  try {
    const result = await request("/admin/at/pending");

    return {
      data: extractProfiles(result),
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: error.message || "No se pudieron cargar los perfiles pendientes.",
    };
  }
}

/**
 * Obtiene todos los perfiles de AT, independientemente de su estado.
 */
export async function getATProfiles() {
  try {
    const result = await request("/admin/at");

    return {
      data: extractProfiles(result),
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: error.message || "No se pudieron cargar los perfiles.",
    };
  }
}

/**
 * Registra la aprobación o el rechazo de un perfil.
 */
export async function reviewATProfile(
  profileId,
  { status, observations = "" }
) {
  try {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new Error("El estado de validación no es válido.");
    }

    if (status === "REJECTED" && !observations.trim()) {
      throw new Error("Debés indicar el motivo del rechazo.");
    }

    const result = await request(
      `/admin/at/${encodeURIComponent(profileId)}/validation`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status,
          observations: observations.trim(),
        }),
      }
    );

    return {
      data: result?.data ?? result,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message || "No se pudo registrar la revisión.",
    };
  }
}
