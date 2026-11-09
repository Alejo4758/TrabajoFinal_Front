// Estilos y límites que comparten las piezas del formulario del perfil profesional.
// Van en un archivo aparte porque los archivos de componentes solo pueden exportar componentes (react-refresh)

export const SELECT_CLASS = "w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60";

// Los mismos máximos que valida el backend (src/services/profileAT.service.js)
export const STUDIES_MAX = 200;

export const LOCALITIES_MAX = 30;

export const EXPERIENCES_MAX = 20;

export const EXPERIENCE_TITLE_MAX = 120;

export const EXPERIENCE_DESCRIPTION_MAX = 1000;

// Especialidades u obras sociales sugeridas porque no están en la lista: largo del nombre y cuántas puede haber esperando revisión
export const SUGGESTION_NAME_MIN = 2;

export const SUGGESTION_NAME_MAX = 80;

export const SUGGESTIONS_MAX = 5;

// Disponibilidad horaria: cuántas franjas puede tener cada día
export const RANGES_PER_DAY_MAX = 3;
