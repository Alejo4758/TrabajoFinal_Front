// Servicio de la pantalla del paciente (vista del AT).
// IMPORTANTE: por ahora SIMULA el backend con datos de prueba. Reemplazá la función por la llamada real (ver TODO).

const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (value) => JSON.parse(JSON.stringify(value));

// Paciente sin información cargada todavía (recién vinculado)
const blank = (base) => ({
  nextMeeting: null, guardian: null, plan: null, sessions: [], objectives: [], supportNetwork: [], reports: [], ...base,
});

// Forma esperada de cada paciente. Las fechas van como "YYYY-MM-DD".
// Los nombres de los objetivos de plan.specificGoals, objectives[].title y sessions[].goals deben coincidir.
const PATIENTS = {
  1: {
    id: 1, name: 'Juan Pérez', age: 12, status: 'Activo', startDate: '2026-03-02', lastActivity: 'Hoy',
    nextMeeting: { date: '2026-11-02', time: '10:00', type: 'Encuentro presencial' },
    case: {
      description: 'Acompañamiento escolar para un niño con TEA: adaptación de contenidos y mediación vincular con pares.',
      locality: 'Neuquén', socialProgram: 'OSEP',
    },
    guardian: { name: 'Laura Pérez', relationship: 'Madre', phone: '299 555-0142', email: 'laura.perez@correo.com' },
    plan: {
      generalGoal: 'Favorecer la autonomía y la integración escolar de Juan en el aula y en los espacios compartidos.',
      specificGoals: ['Mejorar la comunicación con pares durante los recreos', 'Sostener la atención en las consignas por 15 minutos', 'Anticipar y regular los cambios de rutina'],
      areas: ['Educativa', 'Social y vincular', 'Autonomía personal'],
      activities: ['Juegos de roles con pares', 'Agenda visual de la jornada', 'Pausas de regulación sensorial'],
      strategies: ['Anticipación con apoyos visuales', 'Refuerzo positivo inmediato', 'Mediación en situaciones de conflicto'],
      startDate: '2026-03-02', reviewDate: '2026-12-15',
    },
    sessions: [
      { id: 41, date: '2026-10-28', duration: 90, goals: ['Mejorar la comunicación con pares durante los recreos'], activities: ['Juegos de roles con pares', 'Juego de mesa grupal'], observations: 'Inició una conversación con dos compañeros sin mediación. Se mostró entusiasmado con el juego de mesa.' },
      { id: 40, date: '2026-10-21', duration: 90, goals: ['Anticipar y regular los cambios de rutina'], activities: ['Agenda visual de la jornada'], observations: 'Hubo un cambio de aula imprevisto. Usó la agenda visual para anticiparse y se reguló en pocos minutos.' },
      { id: 39, date: '2026-10-14', duration: 60, goals: ['Sostener la atención en las consignas por 15 minutos'], activities: ['Pausas de regulación sensorial'], observations: 'Sostuvo la atención unos 12 minutos. Las pausas cortas ayudaron a continuar la tarea.' },
      { id: 38, date: '2026-10-07', duration: 90, goals: ['Mejorar la comunicación con pares durante los recreos', 'Anticipar y regular los cambios de rutina'], activities: ['Juegos de roles con pares'], observations: 'Primer recreo compartido con otro grupo. Necesitó apoyo inicial y luego participó.' },
    ],
    objectives: [
      { id: 1, title: 'Mejorar la comunicación con pares durante los recreos', note: 'Inicia conversaciones breves sin mediación.', history: [{ date: '2026-08-15', value: 20 }, { date: '2026-09-15', value: 35 }, { date: '2026-10-07', value: 50 }, { date: '2026-10-28', value: 65 }] },
      { id: 2, title: 'Sostener la atención en las consignas por 15 minutos', note: 'Sostiene unos 12 minutos con pausas cortas.', history: [{ date: '2026-08-15', value: 30 }, { date: '2026-09-15', value: 40 }, { date: '2026-10-14', value: 55 }] },
      { id: 3, title: 'Anticipar y regular los cambios de rutina', note: 'Usa la agenda visual de forma autónoma.', history: [{ date: '2026-08-15', value: 25 }, { date: '2026-09-15', value: 50 }, { date: '2026-10-07', value: 70 }, { date: '2026-10-21', value: 80 }] },
    ],
    supportNetwork: [
      { id: 1, group: 'family', name: 'Laura Pérez', role: 'Madre', phone: '299 555-0142', email: 'laura.perez@correo.com', status: 'Activo', notes: 'Responsable del acompañamiento. Prefiere comunicarse por mensajes.' },
      { id: 2, group: 'family', name: 'Roberto Pérez', role: 'Padre', phone: '', email: 'roberto.perez@correo.com', status: 'Invitación pendiente', notes: '' },
      { id: 3, group: 'professional', name: 'Marta Giménez', role: 'Docente de grado', phone: '', email: 'marta.gimenez@escuela.edu.ar', status: 'Activo', notes: 'Coordina las adaptaciones de contenidos en el aula.' },
      { id: 4, group: 'professional', name: 'Dra. Carolina Ibáñez', role: 'Psicopedagoga', phone: '299 555-0177', email: 'c.ibanez@consultorio.com', status: 'Activo', notes: 'Sesiones los jueves.' },
    ],
    reports: [
      { id: 1, title: 'Informe mensual de septiembre', period: 'Septiembre 2026', status: 'Finalizado', createdAt: '2026-10-02' },
      { id: 2, title: 'Informe mensual de octubre', period: 'Octubre 2026', status: 'Borrador', createdAt: '2026-10-29' },
    ],
  },
  2: blank({
    id: 2, name: 'María González', age: 24, status: 'Activo', startDate: '2026-06-10', lastActivity: 'Ayer',
    nextMeeting: { date: '2026-11-02', time: '16:30', type: 'Encuentro presencial' },
    case: { description: 'Acompañamiento en actividades de la vida diaria y organización de rutinas durante un proceso de rehabilitación.', locality: 'Neuquén', socialProgram: 'Incluir Salud' },
    guardian: { name: 'Ana González', relationship: 'Hermana', phone: '299 555-0190', email: 'ana.gonzalez@correo.com' },
    plan: {
      generalGoal: 'Recuperar la autonomía en la organización de su rutina diaria.',
      specificGoals: ['Planificar la semana con una agenda propia'], areas: ['Autonomía personal'],
      activities: ['Armado semanal de agenda'], strategies: ['Acompañamiento gradual con retiro progresivo de apoyos'],
      startDate: '2026-06-10', reviewDate: '2026-12-10',
    },
    sessions: [{ id: 51, date: '2026-10-29', duration: 60, goals: ['Planificar la semana con una agenda propia'], activities: ['Armado semanal de agenda'], observations: 'Completó la agenda de la semana con poca ayuda.' }],
    objectives: [{ id: 1, title: 'Planificar la semana con una agenda propia', note: 'Completa la agenda con poca ayuda.', history: [{ date: '2026-07-15', value: 15 }, { date: '2026-09-15', value: 40 }, { date: '2026-10-29', value: 60 }] }],
    supportNetwork: [{ id: 1, group: 'family', name: 'Ana González', role: 'Hermana', phone: '299 555-0190', email: 'ana.gonzalez@correo.com', status: 'Activo', notes: '' }],
    reports: [{ id: 1, title: 'Informe mensual de septiembre', period: 'Septiembre 2026', status: 'Finalizado', createdAt: '2026-10-03' }],
  }),
  3: blank({
    id: 3, name: 'Tomás Rodríguez', age: 9, status: 'Activo', startDate: '2026-10-26', lastActivity: '28/10',
    case: { description: 'Acompañamiento en el horario escolar para favorecer la participación en actividades grupales.', locality: 'Cipolletti', socialProgram: 'PAMI' },
    guardian: { name: 'Diego Rodríguez', relationship: 'Padre', phone: '299 555-0121', email: 'diego.rodriguez@correo.com' },
  }),
  4: blank({
    id: 4, name: 'Sofía Álvarez', age: 15, status: 'Activo', startDate: '2026-09-01', lastActivity: '25/10',
    nextMeeting: { date: '2026-11-03', time: '09:00', type: 'Encuentro presencial' },
    case: { description: 'Acompañamiento para sostener la asistencia y la organización del estudio.', locality: 'Neuquén', socialProgram: 'OSEP' },
  }),
  5: blank({
    id: 5, name: 'Lucas Benítez', age: 31, status: 'En pausa', startDate: '2026-02-12', lastActivity: '12/10',
    case: { description: 'Acompañamiento domiciliario. El proceso está en pausa por pedido del paciente.', locality: 'Plottier', socialProgram: 'Ninguna (particular)' },
  }),
  6: blank({
    id: 6, name: 'Valentina Ríos', age: 7, status: 'Activo', startDate: '2026-10-05', lastActivity: '10/10',
    case: { description: 'Acompañamiento en la adaptación al nivel primario.', locality: 'Neuquén', socialProgram: 'OSEP' },
  }),
};

export async function getPatient(id) {
  // TODO (backend): GET `${API_URL}/at/patients/${id}` con { headers: authHeaders() }.
  // El backend debe verificar que el paciente pertenezca al AT autenticado. Si el volumen crece,
  // conviene dividir la respuesta por pestaña (plan, sesiones, evolución, red, informes) y pedirla al abrirla.
  void API_URL; void authHeaders;
  await wait(600);
  const patient = PATIENTS[Number(id)];
  if (!patient) throw new Error('No encontramos al paciente.');
  return clone(patient);
}