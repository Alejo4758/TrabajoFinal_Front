// Por ahora SIMULA el backend con datos de prueba. Después reemplazar cada función por la llamada real

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem ('token')}` });
const wait = ms => new Promise (resolve => setTimeout (resolve, ms));

const MOCK = {
  pendingRequests: 2,
  unreadMessages: 3,
  patients: [
    { id: 1, name: 'Juan Pérez', age: 12, lastActivity: 'Hoy', status: 'Activo', nextMeeting: '10:00' },
    { id: 2, name: 'María González', age: 24, lastActivity: 'Ayer', status: 'Activo', nextMeeting: '16:30' },
    { id: 3, name: 'Tomás Rodríguez', age: 9, lastActivity: '28/10', status: 'Activo', nextMeeting: null },
    { id: 4, name: 'Sofía Álvarez', age: 15, lastActivity: '25/10', status: 'Activo', nextMeeting: 'Mañana 09:00' },
    { id: 5, name: 'Lucas Benítez', age: 31, lastActivity: '12/10', status: 'En pausa', nextMeeting: null },
    { id: 6, name: 'Valentina Ríos', age: 7, lastActivity: '10/10', status: 'Activo', nextMeeting: null },
  ],
  appointments: [
    { id: 1, day: 'Hoy', time: '10:00', patient: 'Juan Pérez', type: 'Encuentro presencial' },
    { id: 2, day: 'Hoy', time: '16:30', patient: 'María González', type: 'Encuentro presencial' },
    { id: 3, day: 'Mañana', time: '09:00', patient: 'Sofía Álvarez', type: 'Encuentro presencial' },
  ],
  notifications: [
    { id: 1, text: 'Tenés mensajes nuevos para revisar.', time: 'Hace 15 minutos', unread: true },
    { id: 2, text: 'Se actualizó la información de un paciente.', time: 'Ayer', unread: true },
    { id: 3, text: 'Tenés un encuentro próximo en tu agenda.', time: 'Ayer', unread: true },
  ],
};

// Contadores para las insignias del menú
export async function getATSummary() {
  // (backend): GET `${API_URL}/at/summary` con { headers: authHeaders() }
  // -> { pendingRequests, unreadMessages, unreadNotifications }
  void API_URL; void authHeaders;
  await wait(300);
  return {
    pendingRequests: MOCK.pendingRequests,
    unreadMessages: MOCK.unreadMessages,
    unreadNotifications: MOCK.notifications.filter((n) => n.unread).length,
  };
}

// Datos de la pantalla de inicio
export async function getATDashboard () {
  // (backend): GET `${API_URL}/at/dashboard` con { headers: authHeaders() }
  // -> { pendingRequests, unreadMessages, patients, appointments, notifications }
  await wait(600);
  return JSON.parse (JSON.stringify(MOCK));
}