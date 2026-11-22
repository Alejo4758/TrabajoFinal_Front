import { formatDate } from "./utils";

export const CONTRIBUTION_MAX = 1000;

export const TARGET_TYPES = {
  plan: { section: "plan", tab: "workPlan", label: "Plan de trabajo" },
  session: { section: "sessions", tab: "encounters", label: "Encuentro" },
  goal: { section: "progress", tab: "evolution", label: "Objetivo" },
};

export const BOARD_TABS = [
  { id: "novedades", label: "Novedades", section: null },
  { id: "plan", label: "Plan de trabajo", section: "plan" },
  { id: "encuentros", label: "Encuentros", section: "sessions" },
  { id: "evolucion", label: "Evolución", section: "progress" },
  { id: "informes", label: "Informes", section: "reports" },
];

export const sectionOf = (target) => TARGET_TYPES[target?.type]?.section ?? null;

export const sameTarget = (a, b) => a?.type === b?.type && String(a?.id) === String(b?.id);

export const sessionLabel = (session) =>
  `Encuentro del ${formatDate(session.date, { day: "numeric", month: "long" })}${session.time ? `, ${session.time} h` : ""}`;

export const planTarget = () => ({ type: "plan", id: "plan", label: "Plan de trabajo" });
export const sessionTarget = (session) => ({ type: "session", id: session.id, label: sessionLabel(session) });
export const goalTarget = (goal) => ({ type: "goal", id: goal.id, label: goal.text });

export const AT_ROLE = "AT";

export const authorRoleLabel = (contribution) => {
  if (contribution.authorRole === AT_ROLE) return "Acompañante terapéutico";
  return contribution.authorRelationship || ROLE_FALLBACK[contribution.authorRole] || "Red de apoyo";
};

const ROLE_FALLBACK = {
  family: "Familia",
  education: "Educación",
  health: "Salud",
  other: "Red de apoyo",
};

export function validateContribution(text) {
  const clean = text.trim();
  if (!clean) return "Escribí tu aporte antes de publicarlo";
  if (clean.length > CONTRIBUTION_MAX) return `El aporte puede tener hasta ${CONTRIBUTION_MAX} caracteres`;
  return "";
}

export function formatWhen(iso, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(date)) / 86400000);
  if (days === 0) return `hoy, ${time}`;
  if (days === 1) return `ayer, ${time}`;
  const sameYear = date.getFullYear() === now.getFullYear();
  const day = date.toLocaleDateString("es-AR", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  return `${day}, ${time}`;
}

export const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "?";

// IMPORTANTE: en producción este recorte lo hace el BACKEND antes de responder. Lo que el frontend oculta sigue
// viajando en la respuesta y se puede leer desde las herramientas del navegador. Acá se usa para la vista previa del AT
// (que ya tiene todos los datos) y documenta qué tiene que devolver el endpoint del tablero.
export function scopeBoardData(patient, access = []) {
  const can = (section) => access.includes(section);

  // Si tiene evolución pero no encuentros, recibe solo fecha y valoración
  // de cada objetivo, sin actividades, observaciones ni notas.
  let sessions = [];
  if (can("sessions")) sessions = patient.sessions ?? [];
  else if (can("progress")) {
    sessions = (patient.sessions ?? []).map((session) => ({
      id: session.id,
      date: session.date,
      time: session.time ?? null,
      goals: (session.goals ?? []).map(({ goalId, goalText, level }) => ({ goalId, goalText, level })),
    }));
  }

 
  let plan = null;
  if (patient.plan && can("plan")) {
    const { diagnosis, ...rest } = patient.plan;
    void diagnosis;
    plan = rest;
  } else if (patient.plan && can("progress")) {
    plan = { stages: (patient.plan.stages ?? []).map((stage) => ({ id: stage.id, specificGoals: stage.specificGoals ?? [] })) };
  }

  return { id: patient.id, name: patient.name, plan, sessions };
}