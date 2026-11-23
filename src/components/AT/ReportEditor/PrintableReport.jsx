import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { audienceInfo, periodLabel, sanitizeReportHtml } from "../../../utils/reportModel";
import { formatDate } from "../../../utils/utils";

// Igual que PrintablePlan: al imprimir solo se ve el informe (se oculta el resto de la página, incluidas la barra del editor y los botones)
const PRINT_CSS = `
@media print {
  body > *:not(#report-print-root) { display: none !important; }
  #report-print-root { display: block !important; color: #000; background: #fff; }
  @page { margin: 18mm; }
}`;

const todayISO = () => {
  const now = new Date ();
  return `${now.getFullYear ()}-${String (now.getMonth () + 1).padStart (2, "0")}-${String (now.getDate ()).padStart (2, "0")}`;
};

// Documento formal del informe, con el membrete de RedAT
export function ReportDocumentContent ({ report, patient, authorName }) {
  const html = useMemo (() => sanitizeReportHtml (report.html), [report.html]);

  const meta = [
    ["Paciente", patient?.name],
    ["Destinatario", audienceInfo (report.audience).label],
    ["Período", report.from && report.to ? periodLabel (report.from, report.to) : ""],
    ["Acompañante terapéutico", authorName],
  ].filter (([, value]) => value);

  return (
    <article className="text-text">
      <header className="border-b-2 border-primary pb-4">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="m-0 text-xl font-extrabold tracking-tight text-primary">RedAT</p>
            <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-muted">Red de Acompañamiento Terapéutico</p>
          </div>
          <p className="m-0 text-right text-xs text-text-secondary">
            Fecha de emisión<br/>
            <span className="font-semibold text-text">{formatDate (todayISO (), { day: "numeric", month: "long", year: "numeric" })}</span>
          </p>
        </div>
      </header>

      <div className="mt-6 text-center">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Acompañamiento terapéutico</p>
        <h1 className="m-0 mt-2 text-2xl font-bold">{report.title}</h1>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-8 gap-y-2 rounded-lg border border-border px-4 py-3 text-sm">
        {meta.map (([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{label}</dt>
            <dd className="m-0">{value}</dd>
          </div>
        ))}
      </dl>

      {/* El HTML se sanea antes de mostrarlo: solo quedan las etiquetas del editor */}
      <div className="report-prose mt-6" dangerouslySetInnerHTML={{ __html: html }}/>

      <footer className="mt-10 border-t border-border pt-3 text-center text-[10px] leading-relaxed text-text-muted">
        Documento confidencial: contiene información sensible de la persona acompañada. Su uso queda limitado al destinatario indicado.
      </footer>
    </article>
  );
}

// Caracteres que no se pueden usar en un nombre de archivo (Windows es el más restrictivo)
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]+/g;

// "Informe de Evolución - Noviembre 2026 (Familia) - Juan Pérez"
const printTitle = (report, patient) =>
  [report?.title, patient?.name]
    .map (part => String (part ?? "").replace (INVALID_FILENAME_CHARS, " ").replace (/\s+/g, " ").trim ())
    .filter (Boolean)
    .join (" - ");

// Al guardar como PDF, el navegador propone como nombre de archivo el título de la página (y Chrome además lo imprime
// en el encabezado de cada hoja). Mientras dura la impresión se usa el título del informe con el nombre del paciente,
// y al cerrar el cuadro se vuelve al de siempre
function usePrintDocumentTitle (title) {
  useEffect (() => {
    if (!title) return undefined;
    let previous = null;

    const handleBeforePrint = () => {
      previous = document.title;
      document.title = title;
    };
    const handleAfterPrint = () => {
      if (previous === null) return;
      document.title = previous;
      previous = null;
    };

    window.addEventListener ("beforeprint", handleBeforePrint);
    window.addEventListener ("afterprint", handleAfterPrint);
    return () => {
      handleAfterPrint ();
      window.removeEventListener ("beforeprint", handleBeforePrint);
      window.removeEventListener ("afterprint", handleAfterPrint);
    };
  }, [title]);
}

// Copia del informe que solo se ve al imprimir: va directo en <body> para que no arrastre el diseño de la página
export function PrintableReport (props) {
  usePrintDocumentTitle (props.report ? printTitle (props.report, props.patient) : "");

  if (typeof document === "undefined" || !props.report) return null;
  return createPortal (
    <div id="report-print-root" className="hidden">
      <style>{PRINT_CSS}</style>
      <ReportDocumentContent {...props}/>
    </div>,
    document.body,
  );
}
