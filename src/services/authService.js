import { ROLES } from "../utils/constants";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

// Lee el contenido (payload) del JWT. No verifica la firma: eso lo hace el backend
const decodeTokenPayload = token => {
  try {
    const payload = token.split (".")[1].replace (/-/g, "+").replace (/_/g, "/");
    return JSON.parse (atob (payload));
  }
  catch {
    return null;
  }
};

// Devuelve la sesión guardada en el login ({ token, user, expiresAt }), o null si no hay sesión, el token venció o los datos no son coherentes.
// Todo lo que está en localStorage puede editarlo el usuario: estas validaciones evitan fallas por datos corruptos y que alguien
// se asigne otro rol cambiando el JSON del usuario. La seguridad real la da el backend, que verifica la firma del token
export const getSession = () => {
  let token;
  let user;

  // El acceso a localStorage puede fallar (almacenamiento bloqueado) y el JSON puede estar corrupto: en ambos casos no hay sesión
  try {
    token = localStorage.getItem ("token");
    user = JSON.parse (localStorage.getItem ("user") || "null");
  }
  catch {
    return null;
  }

  if (!token || !user || typeof user !== "object" || user.id == null) return null;
  if (!Object.values (ROLES).includes (user.role)) return null;

  const payload = decodeTokenPayload (token);

  if (!payload) return null;
  if (payload.exp && payload.exp * 1000 <= Date.now ()) return null;

  // El backend firma el token con { userId, role }: el usuario guardado tiene que coincidir con lo que dice el token
  if (payload.userId !== user.id || payload.role !== user.role) return null;

  return { token, user, expiresAt: payload.exp ? payload.exp * 1000 : null };
};

export const saveSession = (token, user) => {
  localStorage.setItem ("token", token);
  localStorage.setItem ("user", JSON.stringify (user));
};

export const clearSession = () => {
  try {
    localStorage.removeItem ("token");
    localStorage.removeItem ("user");
  }
  catch {
    // Si el almacenamiento está bloqueado no hay nada guardado que borrar
  }
};

export const login = async credentials => {
  const response = await fetch (`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify ({
      email: credentials.email.trim (),
      password: credentials.password,
    }),
  });

  const responseText = await response.text ();
  let responseBody = null;

  if (responseText) {
    try {
      responseBody = JSON.parse (responseText);
    }
    catch {
      responseBody = null;
    }
  }

  if (!response.ok) {
    throw new Error (
      responseBody?.message
      || responseBody?.error
      || responseText
      || `Error de autenticación: ${response.status}`
    );
  }

  return responseBody;
};

export const registerAT = async (form, credentials) => {
  if (!BASE_URL) return { status: null, data: null, error: "La URL de la API no está configurada" };

  const formData = new FormData ();

  formData.append ("name", form.name.trim ());
  formData.append ("lastName", form.lastName.trim ());
  formData.append ("dateOfBirth", form.dateOfBirth);
  formData.append ("documentType", form.documentType);
  formData.append ("documentNumber", form.documentNumber.trim ());
  formData.append ("email", form.email.trim ());
  formData.append ("password", form.password.trim ());
  formData.append ("credentials", credentials);

  try {
    const response = await fetch (`${BASE_URL}/auth/register-at`, { // CAMBIAR POR EL ENDPOINT REAL DEL BACK
      method: "POST",
      body: formData,
    });

    const contentType = response.headers.get ("content-type") || "";

    const responseBody = contentType.includes ("application/json") ? await response.json () : null;

    if (response.ok) return { status: response.status, data: responseBody, error: null };

    return { status: response.status, data: null, error: responseBody?.message || responseBody?.error || `Error de backend: ${response.status}` };
  } 
  catch {
    return { status: null, data: null, error: "Error de conexión con el backend. Intentá nuevamente" };
  }
}

export const registerClient = async form => {
  if (!BASE_URL) return { status: null, data: null, error: "La URL de la API no está configurada" };

  const body = { name: form.name, lastName: form.lastName, email: form.email, password: form.password, documentType: form.documentType, documentNumber: form.documentNumber };

  try {
    const response = await fetch (`${BASE_URL}/auth/register`, { // CAMBIAR POR EL ENDPOINT REAL DEL BACK
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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