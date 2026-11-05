// Modelo del plan de trabajo, valores de las listas, sugerencias y validaciones.
//
// Forma de un plan (se deduce de planes reales de acompañamiento terapéutico):
// {
//   id, status: 'draft' | 'active',
//   validFrom, validUntil,              // "YYYY-MM-DD"
//   diagnosis, settings: ['home', 'school', 'community'], weeklyHours,
//   rationale,                          // fundamentación
//   generalGoals: string[], areas: string[],
//   stages: [{ id, name, setting, period, frequency, specificGoals: string[], activities: string[], strategies: string[] }],
//   familyTeam: string[],               // trabajo con la familia y el equipo
//   evaluation: { criteria: string[], reportsFrequency, notes },
//   atRole,                             // rol del acompañante (opcional)
// }

export const SETTINGS = [
  { value: 'home', label: 'Domiciliario', hint: 'En el hogar de la persona acompañada' },
  { value: 'school', label: 'Escolar', hint: 'En la institución educativa' },
  { value: 'community', label: 'Salidas y espacios comunitarios', hint: 'Plaza, actividades recreativas, paseos' },
];

export const AREAS = [
  'Comunicación', 'Regulación emocional', 'Habilidades sociales', 'Autonomía personal',
  'Educativa', 'Rutinas y hábitos', 'Recreativa y comunitaria', 'Trabajo con la familia',
];

export const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'tbd', label: 'A definir' },
];

export const settingLabel = (value) => SETTINGS.find((s) => s.value === value)?.label ?? value;
export const frequencyLabel = (value) => FREQUENCIES.find((f) => f.value === value)?.label ?? '—';

// Sugerencias para completar más rápido (el profesional puede editarlas). Salen de planes reales, redactadas en general.
export const SUGGESTIONS = {
  generalGoals: [
    'Favorecer la regulación emocional y el desarrollo de estrategias de autorregulación.',
    'Fortalecer la tolerancia a la frustración y la aceptación de límites.',
    'Promover habilidades sociales y la interacción respetuosa con pares y adultos.',
    'Promover el desarrollo de la autonomía en las actividades de la vida diaria.',
    'Favorecer la comunicación y la interacción con pares y adultos referentes.',
    'Favorecer la generalización de los aprendizajes trabajados con otros profesionales a los entornos cotidianos.',
  ],
  specificGoals: {
    home: [
      'Mantener rutinas diarias claras y predecibles.',
      'Trabajar la aceptación de consignas y del "no" en el contexto cotidiano.',
      'Favorecer el juego compartido, los turnos y el respeto de reglas.',
      'Estimular la intención comunicativa en un entorno seguro y relajado.',
    ],
    school: [
      'Sostener la permanencia en el aula durante tiempos progresivamente más prolongados.',
      'Favorecer la comprensión de consignas áulicas y de la dinámica escolar.',
      'Promover la interacción con pares en recreos y actividades grupales.',
      'Apoyar la organización de los materiales y de los tiempos de trabajo.',
    ],
    community: [
      'Ampliar gradualmente la participación en salidas recreativas.',
      'Acompañar la anticipación y organización de las salidas y la resolución de imprevistos.',
      'Fortalecer las habilidades sociales en contextos recreativos y comunitarios.',
    ],
  },
  activities: {
    home: [
      'Juegos de mesa y juegos reglados para trabajar turnos, espera y pérdida.',
      'Agenda visual con la secuencia del día.',
      'Actividades de expresión de emociones (tarjetas, dibujo, cuentos).',
    ],
    school: [
      'Acompañamiento en recreos y actividades grupales.',
      'Uso de pictogramas o agenda visual de la jornada escolar.',
      'Pausas de regulación en un espacio de calma.',
    ],
    community: [
      'Salidas breves y planificadas a espacios compartidos (plaza, actividades recreativas).',
      'Planificación conjunta de las salidas, con elección de preferencias.',
    ],
  },
  strategies: {
    home: [
      'Anticipación de actividades con apoyos visuales.',
      'Límites claros, breves y consistentes, sostenidos por todos los adultos.',
      'Refuerzo positivo ante conductas esperadas.',
    ],
    school: [
      'Anticipación de cambios y transiciones.',
      'Presentar las consignas en pasos cortos, verificando su comprensión.',
      'Mediación social en juegos y trabajos grupales.',
      'Registro de episodios (situación previa, conducta, respuesta, resultado) para ajustar estrategias.',
    ],
    community: [
      'Anticipación de recorridos, horarios y acuerdos para las salidas.',
      'Observación y acompañamiento de las interacciones sociales.',
    ],
  },
  familyTeam: [
    'Entrevistas periódicas con la familia para acordar pautas comunes y brindar orientación.',
    'Reuniones con docentes y equipo de orientación escolar para unificar criterios.',
    'Articulación con los profesionales tratantes.',
  ],
  criteria: [
    'Participación y disposición en las propuestas.',
    'Uso de estrategias de regulación.',
    'Autonomía en actividades cotidianas.',
    'Interacción social con pares y adultos.',
    'Comprensión de consignas.',
  ],
};

// ---------- Utilidades ----------
export const newId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function newStage(setting = 'home') {
  return { id: newId(), name: `Ámbito ${settingLabel(setting).toLowerCase()}`, setting, period: '', frequency: '', specificGoals: [], activities: [], strategies: [] };
}

export function emptyPlan() {
  const year = new Date().getFullYear();
  const today = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  return {
    status: 'draft', validFrom: today, validUntil: `${year}-12-31`,
    diagnosis: '', settings: [], weeklyHours: '', rationale: '',
    generalGoals: [], areas: [], stages: [], familyTeam: [],
    evaluation: { criteria: [], reportsFrequency: '', notes: '' }, atRole: '',
  };
}

// Los planes cargados antes de este formulario tenían una forma plana:
// { generalGoal, specificGoals, areas, activities, strategies, startDate, reviewDate }.
// normalizePlan los convierte a la forma actual (con un único ámbito) para poder verlos y editarlos.
// Los datos que el formato viejo no tenía (modalidad, fundamentación, evaluación) quedan vacíos: se completan al editar.
export function normalizePlan(plan) {
  if (!plan) return null;
  if (Array.isArray(plan.stages)) return plan; // ya tiene la forma actual
  return {
    id: plan.id, status: plan.status ?? 'active',
    validFrom: plan.startDate ?? '', validUntil: plan.reviewDate ?? '',
    diagnosis: '', settings: [], weeklyHours: '', rationale: plan.rationale ?? '',
    generalGoals: plan.generalGoal ? [plan.generalGoal] : [], areas: plan.areas ?? [],
    stages: [{
      id: 's1', name: 'Plan de trabajo', setting: 'home', period: '', frequency: '',
      specificGoals: plan.specificGoals ?? [], activities: plan.activities ?? [], strategies: plan.strategies ?? [],
    }],
    familyTeam: [], evaluation: { criteria: [], reportsFrequency: '', notes: '' }, atRole: '',
  };
}

// Objetivos y actividades de todos los ámbitos (sin repetidos). Los usa el registro de encuentros.
export const getPlanGoals = (plan) => [...new Set((normalizePlan(plan)?.stages ?? []).flatMap((s) => s.specificGoals))];
export const getPlanActivities = (plan) => [...new Set((normalizePlan(plan)?.stages ?? []).flatMap((s) => s.activities))];

// ---------- Validación por paso ----------
export const STEP_IDS = ['datos', 'fundamentacion', 'objetivos', 'ambitos', 'familia', 'evaluacion'];

export function validatePlanStep(stepId, plan) {
  const e = {};
  switch (stepId) {
    case 'datos':
      if (plan.settings.length === 0) e.settings = 'Elegí al menos una modalidad de trabajo.';
      if (!plan.validFrom) e.validFrom = 'Indicá desde cuándo rige el plan.';
      if (!plan.validUntil) e.validUntil = 'Indicá hasta cuándo rige el plan.';
      else if (plan.validFrom && plan.validUntil < plan.validFrom) e.validUntil = 'La fecha final no puede ser anterior a la inicial.';
      break;
    case 'fundamentacion': {
      const text = plan.rationale.trim();
      if (!text) e.rationale = 'Escribí la fundamentación del plan.';
      else if (text.length < 30) e.rationale = 'Desarrollá un poco más: al menos 30 caracteres.';
      break;
    }
    case 'objetivos':
      if (plan.generalGoals.length === 0) e.generalGoals = 'Agregá al menos un objetivo general.';
      break;
    case 'ambitos':
      if (plan.stages.length === 0) e.stages = 'Agregá al menos un ámbito de trabajo.';
      plan.stages.forEach((stage) => {
        if (!stage.name.trim()) e[`stage:${stage.id}:name`] = 'Poné un nombre al ámbito.';
        if (stage.specificGoals.length === 0) e[`stage:${stage.id}:goals`] = 'Agregá al menos un objetivo específico.';
        if (stage.activities.length === 0 && stage.strategies.length === 0) e[`stage:${stage.id}:work`] = 'Agregá al menos una actividad o una estrategia.';
      });
      break;
    case 'evaluacion':
      if (plan.evaluation.criteria.length === 0) e.criteria = 'Agregá al menos un criterio de evaluación.';
      if (!plan.evaluation.reportsFrequency) e.reportsFrequency = 'Elegí cada cuánto se redactan los informes.';
      break;
    default:
      break; // "familia" es opcional
  }
  return e;
}

// { pasoId: errores } solo para los pasos con errores
export function validatePlan(plan) {
  return STEP_IDS.reduce((acc, id) => {
    const errors = validatePlanStep(id, plan);
    return Object.keys(errors).length ? { ...acc, [id]: errors } : acc;
  }, {});
}
