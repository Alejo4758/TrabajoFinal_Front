// Perfil profesional del A.T. logueado: lo que el registro no pide y se completa desde "Mi perfil".
// Devuelve { status, data, error } igual que userService. El A.T. sale del token: nunca se manda un id de usuario

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

const request = async (path, { token, ...options } = {}) => {
  try {
    const response = await fetch (`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

// data = { genre, studies, localities: [{ id, name, departmentName, provinceName }], especialityIds, obraSocialIds,
//          experiences: [{ id, title, startDate: "AAAA-MM", finishDate: "AAAA-MM" | null, description }],
//          suggestions: { especialities: { pending: string[], rejected: [{ name, reviewNote }] }, obrasSociales: { ...igual } },
//          isProfileIncomplete, missingProfileFields, options: { genres, especialities, obrasSociales } }
export const getMyProfessionalProfile = async token => {
  if (!token) return { status: 401, data: null, error: "Tenés que iniciar sesión para continuar" };
  return request ("/at/me/profile", { token });
};

// payload = { genre, studies, localityIds, especialityIds, obraSocialIds, suggestedEspecialities: string[], suggestedObrasSociales: string[],
//             experiences: [{ title, startDate, finishDate, description }] }
// suggested* son las que no están en la lista y quedan esperando revisión (la lista completa: las que se sacan se retiran).
// Reemplaza el perfil profesional entero. data es el perfil guardado (la misma forma de arriba, sin options)
export const updateMyProfessionalProfile = async (payload, token) => {
  if (!token) return { status: 401, data: null, error: "Tenés que iniciar sesión para continuar" };
  return request ("/at/me/profile", { token, method: "PUT", body: JSON.stringify (payload) });
};

// Localidades de un departamento, con su id: [{ id, name, departmentName, provinceName }].
// GET /localities devuelve solo nombres, y un nombre no alcanza para guardar la zona de trabajo
export const getLocalityOptions = (province, department) => {
  const params = new URLSearchParams ({ province, ...(department ? { department } : {}) });
  return request (`/localities/options?${params}`);
};
