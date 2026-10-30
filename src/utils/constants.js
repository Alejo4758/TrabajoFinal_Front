export const DAYS_OF_WEEK = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
];

export const ICONS = {
  search: "M21 21l-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
  shield: "M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3.5-10 2.5 2.5 4.5-5",
  chat: "M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z",
  calendar: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm11-2v4M8 3v4M3 11h18",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m12-14a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  check: "m5 12 4 4L19 6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  plan: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9V3Zm0 11 2 2 4-4",
  chart: "M4 20h16M7 20v-7m5 7V6m5 14v-10",
  edit: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Zm9-13 4 4",
  mail: "M4 6h16v12H4V6Zm0 1 8 6 8-6",
  lock: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5v-9Z",
  clock: "M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  check: "m5 12 4 4L19 6",
  close: "M6 6l12 12M18 6 6 18",
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z",
};

export const AT_FEATURES = [
  { icon: "plan", title: "Armá tu plan de trabajo", text: "Estructurá objetivos generales y específicos, áreas de intervención y estrategias de tratamiento" },
  { icon: "chart", title: "Evaluación del tratamiento", text: "Registrá el nivel de evolución de cada objetivo y consultá el progreso con representaciones gráficas" },
  { icon: "edit", title: "Registro del encuentro", text: "Anotá los objetivos trabajados, las actividades realizadas y tus observaciones" }
];

export const USER_FEATURES = [
  { icon: "search", title: "Búsqueda filtrada", text: "A través de la especialidad, zona de trabaj o la disponibilidad horaria, encontrá al profesional que mejor se adapte a tu necesidad" },
  { icon: "shield", title: "Perfiles validados", text: "Todo acompañante es revisado y validado antes de aparecer en los resultados de búsqueda" },
  { icon: "chat", title: "Chat integrado", text: "Si el acompañante acepta tu solicitud, conversan dentro de la plataforma para acordar pautas y coordinar actividades" }
];

export const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export const ROLE_ROUTES = {
  CLIENT: "/searchAT",
  AT: "/ruta-del-at",
  ADMIN: "/panelAdmin"
};

export const DEFAULT_ROUTE = "/";

export const DESCRIPTION_MIN = 20;

export const DESCRIPTION_MAX = 500;

export const MAX_PATIENTS_SHOWN = 5;