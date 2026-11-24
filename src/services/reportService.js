// Servicio de informes del paciente (Feature 15). Devuelve { data, error }, igual que modalRequestService y la parte del titular de patientService.
//
// Con REPORTS_API_READY en true usa el backend (/api/patients/:patientId/reports):
//  - generateReportDraft: borrador con IA (Gemini). El backend anonimiza los datos antes de mandarlos y los completa al volver
//  - refineReportDraft: chat con la IA para pedir cambios sobre el borrador o hacerle consultas
//  - getPatientReports / savePatientReport: informes guardados en la base
// Con REPORTS_API_READY en false (sin backend): el borrador se arma en el navegador con el plan y los encuentros
// (simula la respuesta de la IA), los informes se guardan en memoria hasta recargar la página y el chat no está disponible.
//
// El backend nombra distinto algunos campos (content, periodFrom, periodTo): fromApiReport / toApiReport los traducen
// para que el resto del front siga usando la forma de utils/reportModel.js (html, from, to)

import { audienceInfo, AUDIENCES, buildFormalHeader, escapeHtml, periodLabel, periodName, suggestedTitle } from "../utils/reportModel";
import { getPlanGoals, newId, normalizePlan } from "../utils/planModel";
import { isValidLevel, levelInfo } from "../utils/scale";
import { compareSessions } from "./sessionService";
import { formatDate } from "../utils/utils";

const REPORTS_API_READY = true;

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

const reportsUrl = patientId => `${BASE_URL}/api/patients/${encodeURIComponent (patientId)}/reports`;

const DRAFT_DELAY_MS = 800;
const SAVE_DELAY_MS = 300;

// ---------- Pedido al backend ----------

const request = async (url, token, options = {}) => {
  if (!token) return { data: null, error: "Tenés que iniciar sesión para continuar" };

  try {
    const response = await fetch (url, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get ("content-type") || "";
    const body = contentType.includes ("application/json") ? await response.json () : null;

    if (response.ok) return { data: body?.data ?? body, error: null };

    return { data: null, error: body?.message || body?.error || `Error de backend: ${response.status}` };
  }
  catch (e) {
    // Un pedido cancelado no es un error para mostrar
    if (e?.name === "AbortError") return { data: null, error: null };
    return { data: null, error: "Error de conexión con el backend. Intentá nuevamente" };
  }
};

// Informe del backend con la forma del front
const fromApiReport = report => ({
  id: report.id,
  title: report.title,
  audience: report.audience,
  from: report.periodFrom,
  to: report.periodTo,
  html: report.content,
  status: report.status,
  professional: report.professional,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

// Estados de un informe. Uno finalizado ya no se puede modificar y se comparte con la red de apoyo
// (integrantes con acceso a Informes)
export const REPORT_STATUS = { DRAFT: "DRAFT", FINAL: "FINAL" };

// Informe del front con la forma que valida el backend. Sin status, el backend lo guarda como borrador
const toApiReport = ({ title, audience, from, to, html, status }) => ({
  title,
  audience,
  periodFrom: from,
  periodTo: to,
  content: html,
  ...(status ? { status } : {}),
});

const mapData = (result, map) => (result.data ? { ...result, data: map (result.data) } : result);

// Espera cancelable: si se aborta, resuelve en false
const wait = (ms, signal) => new Promise (resolve => {
  if (signal?.aborted) return resolve (false);
  const timer = setTimeout (() => resolve (true), ms);
  signal?.addEventListener ("abort", () => {
    clearTimeout (timer);
    resolve (false);
  }, { once: true });
});

// ---------- Análisis del período ----------

// Puntajes de un encuentro como [{ goalId, goalText, level, note }]. Acepta las formas anteriores de los registros
const sessionGoals = session => (session.goals ?? session.goalEvaluations ?? session.goalRatings ?? []).map (goal => ({
  goalId: goal.goalId ?? goal.id,
  goalText: goal.goalText ?? goal.text,
  level: Number (goal.level ?? goal.rating ?? goal.value),
  note: goal.note ?? "",
}));

const formatNumber = value => value.toLocaleString ("es-AR", { maximumFractionDigits: 1 });

const levelText = level => `${level}/5 (${levelInfo (level)?.label.toLowerCase () ?? "sin escala"})`;

function summarizeGoal (goal) {
  const { ratings } = goal;
  if (ratings.length === 0) return { ...goal, worked: false };

  const first = ratings[0].level;
  const last = ratings.at (-1).level;
  const average = ratings.reduce ((sum, rating) => sum + rating.level, 0) / ratings.length;
  const delta = last - first;
  const trend = ratings.length === 1 ? "single" : delta >= 1 ? "up" : delta <= -1 ? "down" : "stable";
  const notes = ratings.filter (rating => rating.note?.trim ()).map (rating => ({ date: rating.date, text: rating.note.trim () }));

  return { ...goal, worked: true, first, last, average, trend, notes };
}

// Cruza el plan con los encuentros del período: qué objetivos se trabajaron, cómo evolucionaron, actividades y observaciones
function analyzePeriod (patient, from, to) {
  const plan = normalizePlan (patient.plan);
  const sessions = (patient.sessions ?? [])
    .filter (session => session.date >= from && session.date <= to)
    .sort (compareSessions);

  const stageByGoal = new Map ();
  (plan?.stages ?? []).forEach (stage => stage.specificGoals.forEach (goal => stageByGoal.set (goal.id, stage)));

  const goals = new Map (getPlanGoals (plan).map (goal => [goal.id, { id: goal.id, text: goal.text, stage: stageByGoal.get (goal.id) ?? null, ratings: [] }]));

  sessions.forEach (session => {
    sessionGoals (session).forEach (rating => {
      if (!rating.goalId || !isValidLevel (rating.level)) return;
      // Un objetivo que ya no está en el plan pero se trabajó en el período también se informa
      if (!goals.has (rating.goalId)) goals.set (rating.goalId, { id: rating.goalId, text: rating.goalText || "Objetivo sin descripción", stage: null, ratings: [] });
      goals.get (rating.goalId).ratings.push ({ date: session.date, level: rating.level, note: rating.note });
    });
  });

  const summaries = [...goals.values ()].map (summarizeGoal);

  const activityCount = new Map ();
  sessions.forEach (session => (session.activities ?? []).forEach (activity => activityCount.set (activity, (activityCount.get (activity) ?? 0) + 1)));

  return {
    plan,
    sessions,
    worked: summaries.filter (goal => goal.worked),
    notWorked: summaries.filter (goal => !goal.worked),
    activities: [...activityCount.entries ()].sort ((a, b) => b[1] - a[1]).map (([text, count]) => ({ text, count })),
    observations: sessions.filter (session => session.observations?.trim ()).map (session => ({ date: session.date, text: session.observations.trim () })),
    totalMinutes: sessions.reduce ((sum, session) => sum + (Number (session.duration) || 0), 0),
    stageNames: [...new Set (sessions.map (session => session.stageName).filter (Boolean))],
  };
}

// ---------- Piezas de HTML ----------

const h2 = text => `<h2>${escapeHtml (text)}</h2>`;
const h3 = text => `<h3>${escapeHtml (text)}</h3>`;
const p = html => `<p>${html}</p>`;
const list = items => (items.length ? `<ul>${items.map (item => `<li>${item}</li>`).join ("")}</ul>` : "");
const todo = text => `<strong>[Completar: ${escapeHtml (text)}]</strong>`;

const hoursText = minutes => {
  if (!minutes) return "sin carga horaria registrada";
  const hours = minutes / 60;
  return `${formatNumber (hours)} ${hours === 1 ? "hora" : "horas"}`;
};

const sessionsText = count => (count === 1 ? "1 encuentro" : `${count} encuentros`);

const joinWithAnd = items => (items.length <= 1 ? items.join ("") : `${items.slice (0, -1).join (", ")} y ${items.at (-1)}`);

const firstName = patient => (patient.name ?? "").trim ().split (" ")[0] || "el/la paciente";

// La valoración que escribió el AT antes de generar, un párrafo por línea
const professionalNotes = (extraNotes, fallback) => {
  const paragraphs = String (extraNotes ?? "").split (/\n+/).map (line => line.trim ()).filter (Boolean);
  return paragraphs.length ? paragraphs.map (line => p (escapeHtml (line))).join ("") : p (todo (fallback));
};

const noSessionsNotice = (from, to) =>
  `<blockquote><p>No se registraron encuentros entre el ${escapeHtml (periodLabel (from, to))}. Revisá el período elegido o completá el informe manualmente.</p></blockquote>`;

// Evolución de un objetivo según el registro, en el tono de cada destinatario
function goalEvolution (goal, tone) {
  const count = goal.ratings.length === 1 ? "1 registro" : `${goal.ratings.length} registros`;

  if (tone === "clinical") {
    if (goal.trend === "single") return `Nivel registrado ${levelText (goal.last)} en 1 registro: sin datos suficientes para establecer una tendencia.`;
    const trend = { up: "avance", down: "retroceso", stable: "estable" }[goal.trend];
    return `Nivel inicial ${levelText (goal.first)} y nivel final ${levelText (goal.last)}. Promedio ${formatNumber (goal.average)}/5 en ${count}. Tendencia: <strong>${trend}</strong>.`;
  }

  if (tone === "formal") {
    if (goal.trend === "single") return `Se registró un desempeño de ${levelText (goal.last)} (${count}).`;
    const trend = { up: "Evolución favorable", down: "Se observa un retroceso", stable: "Desempeño sostenido" }[goal.trend];
    return `${trend}: de ${levelText (goal.first)} a ${levelText (goal.last)}, con un promedio de ${formatNumber (goal.average)}/5 (${count}).`;
  }

  const from = levelInfo (goal.first)?.label.toLowerCase ();
  const to = levelInfo (goal.last)?.label.toLowerCase ();

  if (tone === "school") {
    if (goal.trend === "up") return `Mostró avances a lo largo del período: pasó de realizarlo ${from} a realizarlo ${to}.`;
    if (goal.trend === "down") return `En los últimos encuentros necesitó más acompañamiento (${to}) que al inicio del período (${from}).`;
    return `Lo viene realizando ${to}.`;
  }

  // Familia
  if (goal.trend === "up") return `¡Hubo avances! Al principio lo hacía ${from} y en los últimos encuentros lo logra ${to}.`;
  if (goal.trend === "down") return `Es un aspecto que todavía cuesta: en los últimos encuentros lo hizo ${to}. Es parte del proceso y lo seguimos trabajando.`;
  return `Lo viene haciendo ${to}.`;
}

// Estrategias del plan para un ámbito (home, school), o de todo el plan si ese ámbito no tiene
const planStrategies = (plan, setting) => {
  const stages = plan?.stages ?? [];
  const own = stages.filter (stage => stage.setting === setting).flatMap (stage => stage.strategies);
  return [...new Set (own.length ? own : stages.flatMap (stage => stage.strategies))];
};

// ---------- Borradores por destinatario ----------

function obraSocialDraft ({ patient, from, to, extraNotes, data }) {
  const { plan, sessions, worked, notWorked, activities, totalMinutes, stageNames } = data;
  const parts = [buildFormalHeader (patient, "OBRA_SOCIAL", { from, to })];

  parts.push (h2 ("1. Encuadre de la prestación"));
  parts.push (p (`El presente informe da cuenta del acompañamiento terapéutico brindado a <strong>${escapeHtml (patient.name)}</strong> durante el período del ${escapeHtml (periodLabel (from, to))}${plan?.validFrom ? `, en el marco del plan de trabajo vigente desde el ${escapeHtml (formatDate (plan.validFrom))}` : ""}.`));
  parts.push (p (`En el período se realizaron <strong>${sessionsText (sessions.length)}</strong>, con una carga total de ${hoursText (totalMinutes)}.${stageNames.length ? ` Ámbitos de trabajo: ${escapeHtml (joinWithAnd (stageNames))}.` : ""}${plan?.weeklyHours ? ` Carga horaria prevista en el plan: ${escapeHtml (plan.weeklyHours)}.` : ""}`));
  if (plan?.generalGoals?.length) {
    parts.push (p ("Objetivos generales del plan:"));
    parts.push (list (plan.generalGoals.map (escapeHtml)));
  }
  if (sessions.length === 0) parts.push (noSessionsNotice (from, to));

  parts.push (h2 ("2. Evolución de los objetivos específicos"));
  if (worked.length) {
    worked.forEach (goal => {
      parts.push (h3 (goal.text));
      parts.push (p (goalEvolution (goal, "formal")));
    });
  } else {
    parts.push (p (todo ("evolución de los objetivos específicos en el período")));
  }
  if (notWorked.length) {
    parts.push (p ("Objetivos del plan sin registro en el período:"));
    parts.push (list (notWorked.map (goal => escapeHtml (goal.text))));
  }

  parts.push (h2 ("3. Intervenciones realizadas"));
  parts.push (activities.length
    ? list (activities.slice (0, 8).map (activity => escapeHtml (activity.text)))
    : p (todo ("actividades e intervenciones realizadas")));

  parts.push (h2 ("4. Valoración profesional"));
  parts.push (professionalNotes (extraNotes, "valoración profesional del período"));

  parts.push (h2 ("5. Justificación de la continuidad"));
  const inProgress = worked.filter (goal => goal.last < 5).length + notWorked.length;
  parts.push (p (`En función de la evolución observada${inProgress ? ` y de los ${inProgress} objetivos que continúan en proceso` : ""}, se considera necesaria la continuidad del acompañamiento terapéutico, sosteniendo la modalidad y la carga horaria vigentes, a fin de consolidar los logros alcanzados y favorecer su generalización a los entornos cotidianos.`));
  parts.push (p (todo ("frecuencia, carga horaria y período de continuidad solicitados")));

  return parts.join ("");
}

function escuelaDraft ({ patient, from, to, extraNotes, data }) {
  const { plan, sessions, worked, activities } = data;
  const parts = [buildFormalHeader (patient, "ESCUELA", { from, to })];

  parts.push (p (`Por medio del presente se informa a la institución sobre el acompañamiento terapéutico de <strong>${escapeHtml (patient.name)}</strong> durante ${escapeHtml (periodName (from, to))}, con foco en su participación en la dinámica escolar y en las estrategias que favorecen su inclusión en el aula.`));
  if (sessions.length === 0) parts.push (noSessionsNotice (from, to));

  // Primero los objetivos del ámbito escolar; si no hay, los demás trabajados en el período
  const schoolGoals = worked.filter (goal => goal.stage?.setting === "school");
  const goals = schoolGoals.length ? schoolGoals : worked;

  parts.push (h2 ("Objetivos trabajados en el período"));
  parts.push (goals.length
    ? list (goals.map (goal => `<strong>${escapeHtml (goal.text)}</strong> ${goalEvolution (goal, "school")}`))
    : p (todo ("objetivos trabajados en el contexto escolar")));

  parts.push (h2 ("Participación y desempeño en la jornada escolar"));
  if (activities.length) {
    parts.push (p ("Propuestas acompañadas durante el período:"));
    parts.push (list (activities.slice (0, 6).map (activity => escapeHtml (activity.text))));
  }
  parts.push (p (todo ("permanencia en el aula, comprensión de consignas, vínculo con pares y docentes")));

  parts.push (h2 ("Sugerencias para el trabajo áulico"));
  const strategies = planStrategies (plan, "school");
  parts.push (list ((strategies.length ? strategies : [
    "Anticipar los cambios de actividad y las transiciones de la jornada.",
    "Presentar las consignas en pasos cortos, verificando su comprensión.",
    "Ofrecer pausas breves de regulación en un espacio de calma.",
  ]).slice (0, 6).map (escapeHtml)));

  parts.push (h2 ("Valoración del acompañante"));
  parts.push (professionalNotes (extraNotes, "valoración del período en relación con la escolaridad"));

  parts.push (`<blockquote><p>Este informe se elaboró para uso de la institución educativa y omite intencionalmente datos médicos y personales sensibles. Ante consultas sobre el tratamiento, comunicarse con la familia o con el equipo tratante.</p></blockquote>`);

  return parts.join ("");
}

function familiaDraft ({ patient, from, to, extraNotes, data }) {
  const { plan, sessions, worked, notWorked, activities } = data;
  const name = escapeHtml (firstName (patient));
  const parts = [buildFormalHeader (patient, "FAMILIA", { from, to })];

  parts.push (p (`Les compartimos un resumen de cómo vinieron los encuentros con <strong>${name}</strong> durante ${escapeHtml (periodName (from, to))}. ${sessions.length ? `En este tiempo compartimos ${sessionsText (sessions.length)}.` : ""}`));
  if (sessions.length === 0) parts.push (noSessionsNotice (from, to));

  parts.push (h2 ("Lo que trabajamos juntos"));
  parts.push (activities.length
    ? list (activities.slice (0, 6).map (activity => escapeHtml (activity.text)))
    : p (todo ("actividades compartidas en los encuentros")));

  const achievements = worked.filter (goal => goal.trend === "up" || goal.last >= 4);
  const ongoing = [...worked.filter (goal => !achievements.includes (goal)), ...notWorked];

  parts.push (h2 ("Logros y avances"));
  parts.push (achievements.length
    ? list (achievements.map (goal => `<strong>${escapeHtml (goal.text)}</strong> ${goalEvolution (goal, "family")}`))
    : p (`Cada encuentro suma: ${name} sigue construyendo confianza y nuevas herramientas. ${todo ("un logro o momento destacado del período")}`));

  if (ongoing.length) {
    parts.push (h2 ("Lo que seguimos acompañando"));
    parts.push (list (ongoing.map (goal => `<strong>${escapeHtml (goal.text)}</strong>${goal.worked ? ` ${goalEvolution (goal, "family")}` : ""}`)));
  }

  parts.push (h2 ("Pautas para el hogar"));
  const strategies = planStrategies (plan, "home");
  parts.push (list ((strategies.length ? strategies : [
    "Anticipar lo que va a pasar en el día, con palabras simples o apoyos visuales.",
    "Sostener límites claros y breves, acordados entre todos los adultos de la casa.",
    "Reconocer y celebrar los avances, por pequeños que parezcan.",
  ]).slice (0, 5).map (escapeHtml)));

  parts.push (h2 ("Comentarios del acompañante"));
  parts.push (professionalNotes (extraNotes, "comentarios para la familia"));

  parts.push (p ("Quedamos a disposición para conversar cualquier inquietud y seguir construyendo juntos este proceso."));

  return parts.join ("");
}

function equipoMedicoDraft ({ patient, from, to, extraNotes, data }) {
  const { plan, sessions, worked, notWorked, observations, totalMinutes, stageNames } = data;
  const parts = [buildFormalHeader (patient, "EQUIPO_MEDICO", { from, to })];

  parts.push (h2 ("Encuadre"));
  parts.push (p (`${sessionsText (sessions.length)} en el período (${hoursText (totalMinutes)})${stageNames.length ? `. Ámbitos: ${escapeHtml (joinWithAnd (stageNames))}` : ""}.${plan?.validFrom ? ` Plan vigente desde el ${escapeHtml (formatDate (plan.validFrom))} hasta el ${escapeHtml (formatDate (plan.validUntil))}.` : " Sin plan de trabajo vigente."}`));
  if (sessions.length === 0) parts.push (noSessionsNotice (from, to));

  parts.push (h2 ("Evolución por objetivo"));
  if (worked.length) {
    worked.forEach (goal => {
      parts.push (h3 (goal.text));
      parts.push (p (goalEvolution (goal, "clinical")));
      if (goal.notes.length) parts.push (list (goal.notes.slice (-3).map (note => `${escapeHtml (formatDate (note.date, { day: "numeric", month: "short" }))}: ${escapeHtml (note.text)}`)));
    });
  } else {
    parts.push (p (todo ("evolución de los objetivos en el período")));
  }

  if (notWorked.length) {
    parts.push (h2 ("Objetivos sin abordaje en el período"));
    parts.push (list (notWorked.map (goal => escapeHtml (goal.text))));
  }

  parts.push (h2 ("Emergentes y observaciones"));
  parts.push (observations.length
    ? list (observations.map (item => `<strong>${escapeHtml (formatDate (item.date, { day: "numeric", month: "short" }))}:</strong> ${escapeHtml (item.text)}`))
    : p (todo ("emergentes, conductas o situaciones relevantes del período")));

  parts.push (h2 ("Valoración clínica del acompañante"));
  parts.push (professionalNotes (extraNotes, "lectura clínica del período"));

  parts.push (h2 ("Propuestas de ajuste al plan"));
  const proposals = [
    ...worked.filter (goal => goal.trend === "down").map (goal => `Revisar las estrategias del objetivo «${escapeHtml (goal.text)}», que muestra un retroceso.`),
    ...worked.filter (goal => goal.last >= 5).map (goal => `Evaluar dar por logrado el objetivo «${escapeHtml (goal.text)}» y trabajar su generalización.`),
    ...(notWorked.length ? [`Priorizar en el próximo período los ${notWorked.length} objetivos sin abordaje.`] : []),
  ];
  parts.push (list ([...proposals, todo ("ajustes acordados con el equipo")]));

  return parts.join ("");
}

const DRAFT_BUILDERS = {
  OBRA_SOCIAL: obraSocialDraft,
  ESCUELA: escuelaDraft,
  FAMILIA: familiaDraft,
  EQUIPO_MEDICO: equipoMedicoDraft,
};

// ---------- API ----------

// Borrador del informe en HTML para el destinatario elegido. Devuelve { data: { title, html, audience, from, to, stats, warnings }, error }.
// Si se cancela con signal, devuelve { data: null, error: null }
export async function generateReportDraft ({ patient, from, to, audience, extraNotes = "" }, { signal, token } = {}) {
  if (!patient) return { data: null, error: "No se pudo identificar al paciente." };
  if (!from || !to) return { data: null, error: "Elegí el período a analizar." };
  if (from > to) return { data: null, error: "La fecha «Desde» no puede ser posterior a «Hasta»." };
  if (!AUDIENCES.some (item => item.value === audience)) return { data: null, error: "Elegí el destinatario del informe." };

  if (REPORTS_API_READY) {
    const result = await request (`${reportsUrl (patient.id)}/generate-draft`, token, { method: "POST", body: JSON.stringify ({ from, to, audience, extraNotes }), signal });
    return mapData (result, ({ draftHtml, metadata }) => ({
      title: suggestedTitle (audience, from, to),
      html: draftHtml,
      audience,
      from,
      to,
      stats: { sessions: metadata?.encounterCount ?? 0, goalsWorked: metadata?.goalsWorked ?? 0 },
      warnings: metadata?.warnings ?? [],
    }));
  }

  if (!(await wait (DRAFT_DELAY_MS, signal))) return { data: null, error: null };

  try {
    const data = analyzePeriod (patient, from, to);
    const html = DRAFT_BUILDERS[audience] ({ patient, from, to, extraNotes, data });
    return {
      data: {
        title: suggestedTitle (audience, from, to),
        html,
        audience,
        from,
        to,
        stats: { sessions: data.sessions.length, goalsWorked: data.worked.length },
      },
      error: null,
    };
  }
  catch {
    return { data: null, error: "No pudimos generar el borrador. Intentá nuevamente." };
  }
}

// Chat con la IA sobre el borrador. messages es el historial ([{ role: "user" | "assistant", content }]) sin el pedido nuevo,
// que va en instruction. Devuelve { data: { reply, html, changed, warnings }, error }: html es null si el pedido fue solo
// una consulta (el editor queda como está). reply es texto plano: mostrarlo como texto, nunca como HTML.
// Si se cancela con signal, devuelve { data: null, error: null }
export async function refineReportDraft ({ patientId, from, to, audience, extraNotes = "", currentHtml, instruction, messages = [] }, { signal, token } = {}) {
  if (!patientId) return { data: null, error: "No se pudo identificar al paciente." };
  if (!instruction?.trim ()) return { data: null, error: "Escribí qué querés cambiar o consultar del informe." };
  if (!REPORTS_API_READY) return { data: null, error: "El chat con la IA necesita el backend de informes." };

  const result = await request (`${reportsUrl (patientId)}/refine-draft`, token, {
    method: "POST",
    body: JSON.stringify ({ from, to, audience, extraNotes, currentHtml, instruction, messages }),
    signal,
  });
  return mapData (result, ({ reply, draftHtml, changed, metadata }) => ({
    reply,
    html: changed ? draftHtml : null,
    changed: Boolean (changed),
    warnings: metadata?.warnings ?? [],
  }));
}

// ---------- Guardado (en memoria mientras no hay backend) ----------

const memoryStore = new Map ();

const byUpdatedDesc = (a, b) => b.updatedAt.localeCompare (a.updatedAt);

// Informes guardados del paciente, del más reciente al más antiguo
export async function getPatientReports (patientId, { token, signal } = {}) {
  if (!patientId) return { data: null, error: "No se pudo identificar al paciente." };

  if (REPORTS_API_READY) return mapData (await request (reportsUrl (patientId), token, { signal }), reports => reports.map (fromApiReport));

  return { data: [...(memoryStore.get (String (patientId)) ?? [])].sort (byUpdatedDesc), error: null };
}

// Crea el informe o, si trae id, lo actualiza. reportPayload = { id?, title, audience, from, to, html, status? }.
// Con status FINAL se guarda y se finaliza en el mismo pedido (queda compartido con la red). Devuelve el informe guardado
export async function savePatientReport (patientId, reportPayload, { token } = {}) {
  if (!patientId) return { data: null, error: "No se pudo identificar al paciente." };

  const payload = {
    title: reportPayload.title?.trim () ?? "",
    audience: audienceInfo (reportPayload.audience).value,
    from: reportPayload.from,
    to: reportPayload.to,
    html: reportPayload.html ?? "",
    status: reportPayload.status === REPORT_STATUS.FINAL ? REPORT_STATUS.FINAL : undefined,
  };

  if (!payload.title) return { data: null, error: "Poné un título al informe." };

  if (REPORTS_API_READY) {
    const body = JSON.stringify (toApiReport (payload));
    const result = reportPayload.id
      ? await request (`${reportsUrl (patientId)}/${encodeURIComponent (reportPayload.id)}`, token, { method: "PUT", body })
      : await request (reportsUrl (patientId), token, { method: "POST", body });
    return mapData (result, fromApiReport);
  }

  await wait (SAVE_DELAY_MS);

  const key = String (patientId);
  const reports = memoryStore.get (key) ?? [];
  const now = new Date ().toISOString ();
  const existing = reportPayload.id ? reports.find (report => report.id === reportPayload.id) : null;

  const saved = existing
    ? { ...existing, ...payload, updatedAt: now }
    : { id: `rep_${newId ()}`, patientId, ...payload, createdAt: now, updatedAt: now };

  memoryStore.set (key, [saved, ...reports.filter (report => report.id !== saved.id)]);

  return { data: saved, error: null };
}
