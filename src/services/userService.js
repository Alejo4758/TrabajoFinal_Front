// Servicio de la cuenta del usuario. Devuelve { status, data, error } igual que modalRequestService, para manejarlo del mismo modo

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

// Sube o reemplaza la foto de perfil. Si sale bien, data = { id, name, lastName, profilePicture } con la dirección de la foto nueva.
// Solo puede cambiarla el dueño de la cuenta (o un administrador): el backend lo valida contra el token, no contra el id de la URL
export const uploadAvatar = async (userId, file, token) => {
  if (!BASE_URL) return { status: null, data: null, error: "La URL de la API no está configurada" };
  if (!token) return { status: 401, data: null, error: "Tenés que iniciar sesión para continuar" };

  const formData = new FormData ();

  // El nombre "avatar" tiene que coincidir con el que espera el backend
  formData.append ("avatar", file);

  try {
    // No se manda Content-Type: el navegador lo arma solo, con el separador (boundary) que necesita el multipart
    const response = await fetch (`${BASE_URL}/api/users/${encodeURIComponent (userId)}/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
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
