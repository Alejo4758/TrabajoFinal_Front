import { socket } from "../lib/socket";

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
 * Normaliza la respuesta del listado de notificaciones.
 * El backend responde { notifications, unreadCount }; también admite
 * un arreglo directo o un arreglo dentro de "data".
 */
function extractNotifications(result) {
  const notifications = Array.isArray(result)
    ? result
    : result?.notifications ?? result?.data;

  if (!Array.isArray(notifications)) {
    throw new Error(
      "La respuesta del servidor no tiene el formato esperado."
    );
  }

  const unreadCount = Number.isInteger(result?.unreadCount)
    ? result.unreadCount
    : notifications.filter((notification) => !notification.isRead).length;

  return { notifications, unreadCount };
}

/**
 * Obtiene las últimas notificaciones del usuario y la cantidad de no leídas.
 */
export async function getNotifications(userId) {
  try {
    const result = await request(
      `/api/notifications/user/${encodeURIComponent(userId)}`
    );

    return {
      data: extractNotifications(result),
      error: null,
    };
  } catch (error) {
    return {
      data: { notifications: [], unreadCount: 0 },
      error: error.message || "No se pudieron cargar las notificaciones.",
    };
  }
}

/**
 * Marca una notificación como leída.
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const result = await request(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`,
      { method: "PATCH" }
    );

    return {
      data: result?.data ?? result,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message || "No se pudo marcar la notificación como leída.",
    };
  }
}

/**
 * Marca todas las notificaciones del usuario como leídas.
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const result = await request(
      `/api/notifications/user/${encodeURIComponent(userId)}/read-all`,
      { method: "PATCH" }
    );

    return {
      data: result?.data ?? result,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error.message || "No se pudieron marcar las notificaciones como leídas.",
    };
  }
}

/**
 * Escucha las notificaciones nuevas del usuario en tiempo real.
 * Une el socket al canal personal del usuario (y lo vuelve a unir después de
 * cada reconexión). Devuelve una función para cancelar la suscripción.
 */
export function subscribeToNotifications(userId, onNotification) {
  const joinUserChannel = () => socket.emit("join_user_channel", userId);

  // El socket es compartido con el chat y puede seguir unido al canal de una
  // sesión anterior, por eso se descartan las notificaciones de otros usuarios.
  const handleNotification = (notification) => {
    if (Number(notification?.userId) === Number(userId)) {
      onNotification(notification);
    }
  };

  socket.on("connect", joinUserChannel);
  socket.on("new_notification", handleNotification);

  if (socket.connected) {
    joinUserChannel();
  } else {
    socket.connect();
  }

  return () => {
    socket.off("connect", joinUserChannel);
    socket.off("new_notification", handleNotification);
  };
}
