import { useEffect, useState, useRef } from "react";
import { socket } from "../../lib/socket";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ChatPage({ currentUser }) {
  // Si todavía no tienes auth conectada, puedes probar pasando un prop o hardcodeando:
  // const myUserId = currentUser?.id || 1;
  const params = new URLSearchParams(window.location.search);
const myUserId = Number(params.get("user") || currentUser?.id || 1);

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Conectar el socket al montar la página y cargar lista de conversaciones
  useEffect(() => {
    socket.connect();

    fetch(`${API_URL}/api/users/${myUserId}/conversations`)
      .then((res) => res.json())
      .then((data) => {
        setConversations(data);
        if (data.length > 0) setActiveConv(data[0]);
      })
      .catch((err) => console.error("Error cargando conversaciones:", err));

    return () => {
      socket.disconnect();
    };
  }, [myUserId]);

  // 2. Cuando cambia la conversación activa: cargar su historial y unirse a la sala de Socket
  useEffect(() => {
    if (!activeConv) return;

    setLoadingMessages(true);
    // Unirse al room en el backend (ej: conv_5)
    socket.emit("join_chat", activeConv.id);

    fetch(`${API_URL}/api/conversations/${activeConv.id}/messages`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data);
        setLoadingMessages(false);
      })
      .catch((err) => {
        console.error("Error cargando mensajes:", err);
        setLoadingMessages(false);
      });
  }, [activeConv?.id]);

  // 3. Escuchar mensajes entrantes en tiempo real
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      // A) Si el mensaje pertenece al chat que tengo abierto, lo agrego a la lista
      if (activeConv && newMessage.conversationId === activeConv.id) {
        setMessages((prev) => {
          // Evitar duplicados por si acaso
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }

      // B) Actualizar el último mensaje en la barra lateral y subir la conversación al inicio
      setConversations((prevConvs) => {
        const updated = prevConvs.map((conv) => {
          if (conv.id === newMessage.conversationId) {
            return {
              ...conv,
              updatedAt: newMessage.createdAt,
              messages: [newMessage],
            };
          }
          return conv;
        });

        return updated.sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
      });
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [activeConv]);

  // 4. Auto-scroll al fondo cada vez que hay un mensaje nuevo
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Enviar mensaje
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;

    socket.emit("send_message", {
      conversationId: activeConv.id,
      senderId: myUserId,
      content: text.trim(),
    });

    setText("");
  };

  // Helper para obtener el nombre a mostrar en la conversación (1 a 1 vs Grupo)
  const getConversationTitle = (conv) => {
    if (conv.isGroup) return conv.title || "Grupo sin nombre";
    const otherParticipant = conv.users?.find((u) => u.userId !== myUserId);
    return (
      otherParticipant?.user?.name ||
      otherParticipant?.user?.email ||
      `Usuario #${otherParticipant?.userId || ""}`
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-100 border rounded-lg overflow-hidden shadow-sm">
      {/* BARRA LATERAL: Lista de Conversaciones */}
      <aside className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b font-semibold text-lg text-gray-800">
          Mensajes
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-500 text-center">
              No tienes conversaciones activas
            </p>
          ) : (
            conversations.map((conv) => {
              const lastMsg = conv.messages?.[0];
              const isSelected = activeConv?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition flex flex-col gap-1 ${
                    isSelected ? "bg-blue-50 border-l-4 border-blue-600" : ""
                  }`}
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-medium text-gray-900 truncate">
                      {getConversationTitle(conv)}
                    </span>
                    {lastMsg && (
                      <span className="text-xs text-gray-400">
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lastMsg ? lastMsg.content : "Sin mensajes aún..."}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* PANEL DERECHO: Ventana de Chat Activa */}
      <main className="flex-1 flex flex-col bg-gray-50">
        {activeConv ? (
          <>
            {/* Cabecera del chat */}
            <header className="h-16 bg-white border-b px-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-800">
                  {getConversationTitle(activeConv)}
                </h2>
                <span className="text-xs text-gray-400">
                  {activeConv.isGroup ? "Chat grupal" : "Conversación directa"}
                </span>
              </div>
            </header>

            {/* Lista de Mensajes */}
            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <p className="text-center text-sm text-gray-400">
                  Cargando mensajes...
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-gray-400 mt-10">
                  Envía el primer mensaje para iniciar la conversación 👋
                </p>
              ) : (
                messages.map((msg) => {
                  const isMine = Number(msg.senderId) === myUserId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isMine ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          isMine
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white text-gray-800 border rounded-bl-none"
                        }`}
                      >
                        {/* Si es un grupo y no soy yo, mostrar el nombre del remitente */}
                        {activeConv.isGroup && !isMine && (
                          <p className="text-xs font-semibold text-blue-600 mb-1">
                            {msg.sender?.name || `Usuario #${msg.senderId}`}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            isMine ? "text-blue-200" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input para enviar mensaje */}
            <form
              onSubmit={handleSendMessage}
              className="p-4 bg-white border-t flex gap-2"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium px-5 py-2 rounded-full transition"
              >
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Selecciona una conversación para empezar a chatear
          </div>
        )}
      </main>
    </div>
  );
}