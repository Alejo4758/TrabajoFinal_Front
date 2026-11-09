
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

/**
 * Obtiene las especialidades y obras sociales que sugirieron los acompañantes porque no estaban en la lista.
 * status: "PENDING" (por defecto), "APPROVED" o "REJECTED".
 * Cada una trae { id, type: "ESPECIALITY" | "OBRA_SOCIAL", name, status, reviewNote, createdAt, reviewedAt,
 * at: { profileATId, name, lastName, email }, existing: { id, name } | null, sameNameCount }.
 */
export async function getCatalogSuggestions(status = "PENDING") {
  try {
    const result = await request(
      `/admin/catalog-suggestions?status=${encodeURIComponent(status)}`
    );

    return {
      data: extractProfiles(result),
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error: error.message || "No se pudieron cargar las sugerencias.",
    };
  }
}

/**
 * Obtiene las especialidades y obras sociales registradas, con cuántos acompañantes eligió cada una,
 * para buscar si lo que sugieren ya está con otro nombre.
 * data = { ESPECIALITY: [{ id, name, ats }], OBRA_SOCIAL: [{ id, name, ats }] }.
 */
export async function getCatalogs() {
  try {
    const result = await request("/admin/catalogs");

    return {
      data: result?.data ?? result,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message || "No se pudieron cargar las listas.",
    };
  }
}

/**
 * Aprueba o rechaza una sugerencia (y las pendientes con el mismo nombre).
 * Al aprobar, name permite corregir cómo se agrega a la lista; existingId indica que ya estaba en la lista con otro
 * nombre (se marca esa opción y no se agrega nada). Al rechazar, note es el motivo (obligatorio).
 * data = { message, data: { resolved, option, created } }.
 */
export async function reviewCatalogSuggestion(
  suggestionId,
  { status, name = "", note = "", existingId = null }
) {
  try {
    if (!["APPROVED", "REJECTED"].includes(status)) {
      throw new Error("El estado de la revisión no es válido.");
    }

    if (status === "REJECTED" && !note.trim()) {
      throw new Error("Indicá el motivo del rechazo.");
    }

    const result = await request(
      `/admin/catalog-suggestions/${encodeURIComponent(suggestionId)}/review`,
      {
        method: "PATCH",
        body: JSON.stringify(
          status === "REJECTED"
            ? { status, note: note.trim() }
            : existingId
              ? { status, existingId }
              : { status, name: name.trim() }
        ),
      }
    );

    return {
      data: result,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message || "No se pudo registrar la revisión.",
    };
  }
}
