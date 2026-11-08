import { Fragment, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { socket } from "../../lib/socket";
import { useAuth } from "../../hooks/useAuth";
import { subscribeToNotifications } from "../../services/notificationService";
import { DEFAULT_ROUTE, ROLE_ROUTES } from "../../utils/constants";
import { initials } from "../../utils/utils";
import Icon from "../../components/Icon/Icon";
import UserAvatar from "../../components/Avatar/Avatar";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const fetchConversations = (userId) =>
  fetch(`${API_URL}/api/users/${userId}/conversations`)
    .then((res) => res.json())
    .then((data) => (Array.isArray(data) ? data : []));

// La conversación con actividad más reciente va primero
const sortByRecent = (conversations) =>
  [...conversations].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

const fullName = (person) =>
  [person?.name, person?.lastName].filter(Boolean).join(" ");

const startOfDay = (date) => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

const isSameDay = (a, b) => startOfDay(a) === startOfDay(b);

const daysAgo = (date) =>
  Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

const formatTime = (date) =>
  new Date(date).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

// Para la lista: la hora si el mensaje es de hoy, "Ayer" o la fecha
const formatListDate = (date) => {
  const days = daysAgo(date);
  if (days === 0) return formatTime(date);
  if (days === 1) return "Ayer";
  return new Date(date).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
};

// Para los separadores de día dentro del chat
const formatDayLabel = (date) => {
  const days = daysAgo(date);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function Avatar({ name, image, isGroup = false, className = "size-11" }) {
  // Con foto (solo en chats 1 a 1) se usa el avatar compartido, que vuelve a las iniciales si la imagen no carga
  if (image && !isGroup) {
    return <UserAvatar image={image} name={name} className={className} />;
  }

  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-primary font-semibold text-white ${className}`}
    >
      {isGroup ? <Icon name="users" /> : initials(name) || "?"}
    </div>
  );
}

export default function ChatPage() {
  // La ruta está protegida, así que siempre hay una sesión iniciada.
  // Si la sesión se cierra, ProtectedRoute desmonta esta página antes de que se renderice sin usuario.
  const { user } = useAuth();
  const myUserId = Number(user.id);

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  // Mensajes recibidos en esta visita en chats que no estaban abiertos: { [conversationId]: cantidad }
  const [unread, setUnread] = useState({});
  const [sendError, setSendError] = useState("");

  const messagesEndRef = useRef(null);
  // Al abrir un chat se salta directo al final; con un mensaje nuevo se desplaza suave
  const instantScroll = useRef(false);

  const activeConv = conversations.find((conv) => conv.id === activeId) ?? null;

  // 1. Conectar el socket al montar la página y cargar lista de conversaciones
  useEffect(() => {
    let cancelled = false;

    socket.connect();

    fetchConversations(myUserId)
      .then((data) => {
        if (cancelled) return;
        setConversations(sortByRecent(data));
        // En pantallas chicas se muestra primero la lista, sin abrir ningún chat
        if (data.length > 0 && window.matchMedia("(min-width: 768px)").matches) {
          setActiveId(data[0].id);
          setLoadingMessages(true);
        }
        setLoadingConversations(false);
      })
      .catch((err) => {
        console.error("Error cargando conversaciones:", err);
        if (!cancelled) setLoadingConversations(false);
      });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [myUserId]);

  // 2. Unirse a la sala de todas las conversaciones, no solo a la abierta: así llegan en vivo
  // los mensajes de cualquier chat y la lista se reordena sola. Al reconectarse el socket
  // pierde las salas, por eso se vuelve a unir en cada "connect"
  const conversationIds = conversations
    .map((conv) => conv.id)
    .sort((a, b) => a - b)
    .join(",");

  useEffect(() => {
    if (!conversationIds) return;

    const joinAll = () =>
      conversationIds
        .split(",")
        .forEach((id) => socket.emit("join_chat", Number(id)));

    socket.on("connect", joinAll);
    if (socket.connected) joinAll();

    return () => {
      socket.off("connect", joinAll);
    };
  }, [conversationIds]);

  // 3. Una conversación recién creada (por ejemplo, por una solicitud de entrevista) todavía no
  // tiene sala unida, así que sus mensajes no llegan por "receive_message". El aviso sí llega al
  // canal personal: ahí se vuelve a pedir la lista y se suman las conversaciones que falten
  useEffect(() => {
    return subscribeToNotifications(myUserId, () => {
      fetchConversations(myUserId)
        .then((data) => {
          setConversations((prev) => {
            const added = data.filter(
              (conv) => !prev.some((known) => known.id === conv.id)
            );
            return added.length > 0 ? sortByRecent([...prev, ...added]) : prev;
          });
        })
        .catch((err) => console.error("Error actualizando conversaciones:", err));
    });
  }, [myUserId]);

  // 4. Cuando cambia la conversación activa: cargar su historial
  useEffect(() => {
    if (!activeId) return;

    let cancelled = false;

    fetch(`${API_URL}/api/conversations/${activeId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const history = Array.isArray(data) ? data : [];
        instantScroll.current = true;
        // Se conservan los mensajes que hayan llegado por socket mientras se pedía el historial
        setMessages((prev) => [
          ...history,
          ...prev.filter((m) => !history.some((h) => h.id === m.id)),
        ]);
        setLoadingMessages(false);
      })
      .catch((err) => {
        console.error("Error cargando mensajes:", err);
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // 5. Escuchar mensajes entrantes en tiempo real
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      const convId = newMessage.conversationId;

      if (convId === activeId) {
        // A) Si el mensaje pertenece al chat que tengo abierto, lo agrego a la lista
        setMessages((prev) => {
          // Evitar duplicados por si acaso
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      } else if (Number(newMessage.senderId) !== myUserId) {
        // B) Si es de otro chat, queda marcado como no leído
        setUnread((prev) => ({ ...prev, [convId]: (prev[convId] || 0) + 1 }));
      }

      // C) Actualizar el último mensaje en la barra lateral y subir la conversación al inicio
      setConversations((prevConvs) =>
        sortByRecent(
          prevConvs.map((conv) =>
            conv.id === convId
              ? { ...conv, updatedAt: newMessage.createdAt, messages: [newMessage] }
              : conv
          )
        )
      );
    };

    const handleErrorMessage = (message) => {
      setSendError(
        typeof message === "string" ? message : "No se pudo enviar el mensaje"
      );
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("error_message", handleErrorMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("error_message", handleErrorMessage);
    };
  }, [activeId, myUserId]);

  // 6. Auto-scroll al fondo cada vez que hay un mensaje nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instantScroll.current ? "auto" : "smooth",
    });
    instantScroll.current = false;
  }, [messages]);

  const openConversation = (id) => {
    if (id === activeId) return;
    setActiveId(id);
    setMessages([]);
    setLoadingMessages(true);
    setSendError("");
    setUnread((prev) => ({ ...prev, [id]: 0 }));
  };

  // Solo se usa en pantallas chicas: vuelve de un chat a la lista
  const closeConversation = () => {
    setActiveId(null);
    setMessages([]);
    setSendError("");
  };

  // 7. Enviar mensaje
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;

    socket.emit("send_message", {
      conversationId: activeConv.id,
      senderId: myUserId,
      content: text.trim(),
    });

    setText("");
    setSendError("");
  };

  // Helper para obtener el nombre a mostrar en la conversación (1 a 1 vs Grupo)
  const getConversationTitle = (conv) => {
    if (conv.isGroup) return conv.title || "Grupo sin nombre";
    const otherParticipant = conv.users?.find((u) => u.userId !== myUserId);
    return (
      fullName(otherParticipant?.user) ||
      otherParticipant?.user?.email ||
      `Usuario #${otherParticipant?.userId || ""}`
    );
  };

  // Foto del otro participante. Solo en chats 1 a 1: los grupos muestran su ícono
  const getConversationImage = (conv) =>
    conv.isGroup
      ? null
      : conv.users?.find((u) => u.userId !== myUserId)?.user?.profilePicture;

  return (
    <div className="flex h-page bg-background text-text">
      {/* BARRA LATERAL: Lista de Conversaciones. En pantallas chicas se oculta al abrir un chat */}
      <aside
        className={`${
          activeConv ? "hidden md:flex" : "flex"
        } w-full flex-col border-r border-border bg-surface md:w-80 lg:w-96`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-3">
          <Link
            to={ROLE_ROUTES[user.role] ?? DEFAULT_ROUTE}
            aria-label="Volver al inicio"
            className="grid size-10 place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <Icon name="arrow" className="h-5 w-5 rotate-180" />
          </Link>
          <h1 className="text-lg font-bold">Mensajes</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="animate-pulse space-y-1 p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="size-11 shrink-0 rounded-full bg-surface-alt" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 rounded bg-surface-alt" />
                    <div className="h-3 w-3/4 rounded bg-surface-alt" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="grid size-14 place-items-center rounded-full bg-surface-alt text-text-muted">
                <Icon name="chat" className="h-7 w-7" />
              </div>
              <p className="mt-4 font-semibold">No tenés conversaciones</p>
              <p className="mt-1 text-sm text-text-muted">
                Cuando empieces a hablar con alguien, el chat va a aparecer acá
              </p>
            </div>
          ) : (
            <ul className="m-0 list-none p-2">
              {conversations.map((conv) => {
                const lastMsg = conv.messages?.[0];
                const isSelected = activeId === conv.id;
                const unreadCount = unread[conv.id] || 0;
                const title = getConversationTitle(conv);

                return (
                  <li key={conv.id}>
                    <button
                      type="button"
                      onClick={() => openConversation(conv.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                        isSelected ? "bg-primary-light" : "hover:bg-surface-alt"
                      }`}
                    >
                      <Avatar
                        name={title}
                        image={getConversationImage(conv)}
                        isGroup={conv.isGroup}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`truncate ${
                              unreadCount > 0 ? "font-bold" : "font-semibold"
                            }`}
                          >
                            {title}
                          </span>
                          {lastMsg && (
                            <span
                              className={`shrink-0 text-xs ${
                                unreadCount > 0
                                  ? "font-semibold text-primary"
                                  : "text-text-secondary"
                              }`}
                            >
                              {formatListDate(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-sm ${
                              unreadCount > 0
                                ? "font-medium text-text"
                                : "text-text-secondary"
                            }`}
                          >
                            {lastMsg
                              ? `${
                                  Number(lastMsg.senderId) === myUserId ? "Vos: " : ""
                                }${lastMsg.content}`
                              : "Sin mensajes todavía"}
                          </p>
                          {unreadCount > 0 && (
                            <span
                              aria-label={`${unreadCount} mensajes sin leer`}
                              className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-white"
                            >
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* PANEL DERECHO: Ventana de Chat Activa */}
      <main
        className={`${
          activeConv ? "flex" : "hidden md:flex"
        } min-w-0 flex-1 flex-col`}
      >
        {activeConv ? (
          <>
            {/* Cabecera del chat */}
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface px-3 sm:px-6">
              <button
                type="button"
                onClick={closeConversation}
                aria-label="Volver a la lista de conversaciones"
                className="grid size-10 cursor-pointer place-items-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 md:hidden"
              >
                <Icon name="arrow" className="h-5 w-5 rotate-180" />
              </button>
              <Avatar
                name={getConversationTitle(activeConv)}
                image={getConversationImage(activeConv)}
                isGroup={activeConv.isGroup}
                className="size-10"
              />
              <div className="min-w-0">
                <h2 className="truncate font-semibold">
                  {getConversationTitle(activeConv)}
                </h2>
                {activeConv.isGroup && (
                  <p className="text-xs text-text-muted">Chat grupal</p>
                )}
              </div>
            </header>

            {/* Lista de Mensajes */}
            <div className="flex-1 overflow-y-auto bg-slate-200 px-3 py-4 sm:px-6">
              <div className="flex min-h-full flex-col justify-end">
                {loadingMessages ? (
                  <p className="py-10 text-center text-sm text-text-secondary">
                    Cargando mensajes...
                  </p>
                ) : messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-text-secondary">
                    Enviá el primer mensaje para iniciar la conversación
                  </p>
                ) : (
                  messages.map((msg, index) => {
                    const isMine = Number(msg.senderId) === myUserId;
                    const previous = messages[index - 1];
                    const next = messages[index + 1];
                    const startsDay =
                      !previous || !isSameDay(previous.createdAt, msg.createdAt);
                    // Los mensajes seguidos de una misma persona se agrupan
                    const startsGroup =
                      startsDay || previous.senderId !== msg.senderId;
                    const endsGroup =
                      !next ||
                      next.senderId !== msg.senderId ||
                      !isSameDay(next.createdAt, msg.createdAt);

                    return (
                      <Fragment key={msg.id}>
                        {startsDay && (
                          <div className="my-4 flex justify-center">
                            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-text-secondary shadow-sm">
                              {formatDayLabel(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${
                            isMine ? "justify-end" : "justify-start"
                          } ${startsGroup ? "mt-3" : "mt-1"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[65%] ${
                              isMine
                                ? "bg-primary text-white"
                                : "bg-surface text-text"
                            } ${
                              endsGroup
                                ? isMine
                                  ? "rounded-br-md"
                                  : "rounded-bl-md"
                                : ""
                            }`}
                          >
                            {/* Si es un grupo y no soy yo, mostrar el nombre del remitente */}
                            {activeConv.isGroup && !isMine && startsGroup && (
                              <p className="mb-1 text-xs font-semibold text-primary">
                                {fullName(msg.sender) || `Usuario #${msg.senderId}`}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <span
                              className={`mt-1 block text-right text-[11px] ${
                                isMine ? "text-white/85" : "text-text-secondary"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input para enviar mensaje */}
            <div className="shrink-0 border-t border-border bg-surface p-3 sm:px-6">
              {sendError && (
                <p role="alert" className="mb-2 text-sm text-danger">
                  {sendError}
                </p>
              )}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribí un mensaje..."
                  aria-label="Mensaje"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-full border border-border-strong bg-surface-alt px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  aria-label="Enviar mensaje"
                  className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-text-disabled"
                >
                  <Icon name="arrow" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-surface-alt text-text-muted">
              <Icon name="chat" className="h-8 w-8" />
            </div>
            <p className="mt-4 font-semibold">Tus mensajes</p>
            <p className="mt-1 text-sm text-text-muted">
              Elegí una conversación para empezar a chatear
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
