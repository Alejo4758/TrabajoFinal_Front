const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

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