// services/sessionService.js

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Registra un encuentro simulado.
 *
 * Estructura:
 * {
 *   id,
 *   date,
 *   duration,
 *   stageId,
 *   stageName,
 *   goalIds,
 *   goalEvaluations: [{ goalId, goalText, rating, note }],
 *   activities,
 *   observations
 * }
 */
export async function createSession(patientId, session) {
  if (!patientId) {
    throw new Error("No se pudo identificar al paciente.");
  }

  await wait(500);

  return {
    ...session,
    id: createId(),
    patientId,
    createdAt: new Date().toISOString(),
  };
}