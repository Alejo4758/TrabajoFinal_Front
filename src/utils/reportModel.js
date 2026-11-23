// Modelo de los informes del paciente: destinatarios, períodos, bloques rápidos y saneado del HTML.
//
// Forma de un informe guardado:
// {
//   id, patientId,
//   title,
//   audience: 'OBRA_SOCIAL' | 'ESCUELA' | 'FAMILIA' | 'EQUIPO_MEDICO',
//   from, to,                // "YYYY-MM-DD": período que cubre el informe
//   html,                    // contenido del editor (h1, h2, h3, p, ul, ol, li, blockquote, strong, em, u)
//   createdAt, updatedAt,    // instantes ISO
// }

import { formatDate } from "./utils";

// tone: color del Pill de cada destinatario (utils/constants.js > PILL_TONES)
export const AUDIENCES = [
  {
    value: "OBRA_SOCIAL",
    label: "Obra Social / Prepaga",
    short: "Obra Social",
    focus: "Formal, técnico y con justificación de la continuidad de la prestación.",
    tone: "primary",
  },
  {
    value: "ESCUELA",
    label: "Institución Educativa / EOE",
    short: "Escuela",
    focus: "Pedagógico y áulico. Resguarda los datos médicos y personales.",
    tone: "warning",
  },
  {
    value: "FAMILIA",
    label: "Familia / Tutores",
    short: "Familia",
    focus: "Empático y cercano, con pautas concretas para el hogar.",
    tone: "success",
  },
  {
    value: "EQUIPO_MEDICO",
    label: "Equipo Terapéutico",
    short: "Equipo terapéutico",
    focus: "Clínico y evolutivo, con los emergentes del período.",
    tone: "neutral",
  },
];

export const audienceInfo = value => AUDIENCES.find (audience => audience.value === value) ?? AUDIENCES[0];

// Datos que no se comparten con cada destinatario. La escuela no recibe datos médicos ni personales sensibles
const PRIVATE_FIELDS = {
  OBRA_SOCIAL: [],
  ESCUELA: ["documentNumber", "address", "diagnosis", "socialProgram"],
  FAMILIA: ["documentNumber", "address"],
  EQUIPO_MEDICO: [],
};

export const sharesField = (audience, field) => !(PRIVATE_FIELDS[audience] ?? []).includes (field);

// ---------- Fechas ----------

const pad = n => String (n).padStart (2, "0");

const toISODay = date => `${date.getFullYear ()}-${pad (date.getMonth () + 1)}-${pad (date.getDate ())}`;

// Primer y último día del mes actual, en hora local
export function currentMonthRange (today = new Date ()) {
  const first = new Date (today.getFullYear (), today.getMonth (), 1);
  const last = new Date (today.getFullYear (), today.getMonth () + 1, 0);
  return { from: toISODay (first), to: toISODay (last) };
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const monthOf = iso => {
  const m = /^(\d{4})-(\d{2})/.exec (iso || "");
  return m ? { year: Number (m[1]), month: Number (m[2]) - 1 } : null;
};

// "2026-11-01".."2026-11-30" -> "Noviembre 2026"; "2026-09-01".."2026-11-30" -> "Septiembre a Noviembre 2026"
export function periodName (from, to) {
  const start = monthOf (from);
  const end = monthOf (to) ?? start;
  if (!start) return "";
  if (start.year === end.year && start.month === end.month) return `${MONTHS[start.month]} ${start.year}`;
  if (start.year === end.year) return `${MONTHS[start.month]} a ${MONTHS[end.month]} ${end.year}`;
  return `${MONTHS[start.month]} ${start.year} a ${MONTHS[end.month]} ${end.year}`;
}

// "1 nov 2026 al 30 nov 2026"
export const periodLabel = (from, to) => `${formatDate (from)} al ${formatDate (to)}`;

// Título sugerido: "Informe de Evolución - Noviembre 2026 (Obra Social)"
export const suggestedTitle = (audience, from, to) => `Informe de Evolución - ${periodName (from, to)} (${audienceInfo (audience).short})`;

// ---------- HTML ----------

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

// Todo texto que viene de los datos (nombres, observaciones, objetivos) se escapa antes de armar el HTML del borrador
export const escapeHtml = value => String (value ?? "").replace (/[&<>"']/g, char => ESCAPES[char]);

// true si el HTML no tiene texto (el editor vacío devuelve "<p></p>")
export const isHtmlEmpty = html => !String (html ?? "").replace (/<[^>]*>/g, "").replace (/&nbsp;/g, " ").trim ();

const ALLOWED_TAGS = new Set (["H1", "H2", "H3", "P", "BR", "STRONG", "B", "EM", "I", "U", "S", "UL", "OL", "LI", "BLOCKQUOTE", "HR"]);
const ALIGNMENTS = new Set (["left", "center", "right", "justify"]);

// Deja solo las etiquetas que produce el editor y la alineación del texto. Se usa al mostrar un informe fuera del editor
// (vista de impresión): cuando los informes vengan del backend no se inserta en la página HTML sin revisar
export function sanitizeReportHtml (html) {
  if (typeof DOMParser === "undefined") return "";
  const source = new DOMParser ().parseFromString (`<body>${html ?? ""}</body>`, "text/html").body;
  const output = document.createElement ("div");

  const copyChildren = (from, to) => {
    from.childNodes.forEach (node => {
      if (node.nodeType === Node.TEXT_NODE) {
        to.appendChild (document.createTextNode (node.textContent));
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (!ALLOWED_TAGS.has (node.tagName)) {
        // Una etiqueta no permitida se descarta, pero se conserva su texto (salvo scripts y estilos)
        if (!["SCRIPT", "STYLE", "IFRAME", "OBJECT"].includes (node.tagName)) copyChildren (node, to);
        return;
      }
      const clean = document.createElement (node.tagName.toLowerCase ());
      const align = node.style?.textAlign;
      if (ALIGNMENTS.has (align)) clean.style.textAlign = align;
      copyChildren (node, clean);
      to.appendChild (clean);
    });
  };

  copyChildren (source, output);
  return output.innerHTML;
}

// ---------- Bloques rápidos del editor ----------

// Encabezado con los datos del paciente. Respeta lo que se comparte con cada destinatario
export function buildFormalHeader (patient, audience, { from, to } = {}) {
  const rows = [
    ["Paciente", patient?.name],
    ["Edad", patient?.age != null ? `${patient.age} años` : ""],
    ["DNI", sharesField (audience, "documentNumber") ? patient?.documentNumber : ""],
    ["Domicilio", sharesField (audience, "address") ? patient?.address : ""],
    ["Obra social / cobertura", sharesField (audience, "socialProgram") ? patient?.case?.socialProgram : ""],
    ["Diagnóstico", sharesField (audience, "diagnosis") ? patient?.diagnosis : ""],
    ["Período informado", from && to ? periodLabel (from, to) : ""],
  ].filter (([, value]) => value);

  const items = rows.map (([label, value]) => `<li><strong>${escapeHtml (label)}:</strong> ${escapeHtml (value)}</li>`).join ("");

  return `<h2>Datos del paciente</h2><ul>${items}</ul>`;
}

// Cierre profesional con espacio para la firma y la matrícula del AT
export function buildSignatureBlock (authorName, today = new Date ()) {
  const date = formatDate (toISODay (today), { day: "numeric", month: "long", year: "numeric" });
  return [
    `<p>Sin otro particular, saludo atentamente.</p>`,
    `<p>Fecha: ${escapeHtml (date)}</p>`,
    `<p></p><p></p>`,
    `<p>______________________________</p>`,
    `<p><strong>${escapeHtml (authorName || "Acompañante terapéutico")}</strong><br>Acompañante terapéutico<br>Matrícula N.º: ____________</p>`,
  ].join ("");
}
