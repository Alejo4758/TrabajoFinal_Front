
export const SCALE_MIN = 1;
export const SCALE_MAX = 5;

// Escala provisional para describir el desempeño observado
// durante un encuentro. No representa un estado permanente.
export const SCALE_LEVELS = [
  {
    value: 1,
    label: "Aún no lo logra",
    description: "No se observa la conducta durante este encuentro, aun con apoyo.",
  },
  {
    value: 2,
    label: "Con apoyo constante",
    description: "Realiza la actividad únicamente con ayuda permanente.",
  },
  {
    value: 3,
    label: "Con apoyo parcial",
    description: "Necesita ayuda en varios momentos de la actividad.",
  },
  {
    value: 4,
    label: "Con apoyo mínimo",
    description: "Necesita ayuda solo de manera ocasional.",
  },
  {
    value: 5,
    label: "Autónomo",
    description: "Realiza la actividad de forma autónoma durante este encuentro.",
  },
];

export function levelInfo(value) {
  return SCALE_LEVELS.find((level) => level.value === Number(value)) ?? null;
}

export function isValidLevel(value) {
  return (
    Number.isInteger(Number(value)) &&
    Number(value) >= SCALE_MIN &&
    Number(value) <= SCALE_MAX
  );
}
