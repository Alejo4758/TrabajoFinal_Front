import { createPortal } from 'react-dom';
import { formatDate } from '../../../utils/utils';
import { frequencyLabel, settingLabel } from '../../../utils/planModel';

// Reglas de impresión: al imprimir solo se ve el documento del plan (se oculta el resto de la página)
const PRINT_CSS = `
@media print {
  body > *:not(#plan-print-root) { display: none !important; }
  #plan-print-root { display: block !important; color: #000; background: #fff; }
  @page { margin: 18mm; }
}`;

function Section({ number, title, subtitle, children }) {
  return (
    <section className="break-inside-avoid-page">
      <h3 className="m-0 text-base font-bold">{number}. {title}</h3>
      {subtitle && <p className="m-0 mt-0.5 text-sm text-text-secondary">{subtitle}</p>}
      <div className="mt-3 space-y-4 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

function Bullets({ items, title }) {
  if (!items?.length) return null;
  return (
    <div>
      {title && <h4 className="m-0 mb-1.5 text-sm font-semibold">{title}</h4>}
      <ul className="m-0 list-disc space-y-1 pl-5">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

// Contenido formal del plan. Se usa en pantalla y en la versión para imprimir.
export function PlanDocumentContent({ plan, patient, authorName }) {
  const year = plan.validFrom?.slice(0, 4);
  const sections = [];

  sections.push({
    title: 'Datos generales',
    body: (
      <dl className="m-0 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {[
          ['Paciente', patient.name],
          ['Edad', patient.age ? `${patient.age} años` : ''],
          ['Diagnóstico', plan.diagnosis],
          ['Modalidad', plan.settings.map(settingLabel).join(', ')],
          ['Carga horaria', plan.weeklyHours],
          ['Vigencia', `${formatDate(plan.validFrom)} al ${formatDate(plan.validUntil)}`],
          ['Acompañante terapéutico', authorName],
        ].filter(([, value]) => value).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</dt>
            <dd className="m-0 mt-0.5">{value}</dd>
          </div>
        ))}
      </dl>
    ),
  });

  sections.push({ title: 'Fundamentación', body: <p className="m-0 whitespace-pre-line">{plan.rationale}</p> });
  sections.push({
    title: 'Objetivos generales',
    body: (
      <>
        <Bullets items={plan.generalGoals} />
        {plan.areas.length > 0 && <p className="m-0"><strong>Áreas de intervención:</strong> {plan.areas.join(', ')}.</p>}
      </>
    ),
  });

  plan.stages.forEach((stage) => {
    const details = [settingLabel(stage.setting), stage.period, stage.frequency].filter(Boolean).join(' · ');
    sections.push({
      title: stage.name,
      subtitle: details,
      body: (
        <>
          <Bullets title="Objetivos específicos" items={stage.specificGoals} />
          <Bullets title="Actividades propuestas" items={stage.activities} />
          <Bullets title="Estrategias" items={stage.strategies} />
        </>
      ),
    });
  });

  if (plan.familyTeam.length > 0) sections.push({ title: 'Trabajo con la familia y el equipo', body: <Bullets items={plan.familyTeam} /> });
  if (plan.atRole?.trim()) sections.push({ title: 'Rol del acompañante terapéutico', body: <p className="m-0 whitespace-pre-line">{plan.atRole}</p> });

  sections.push({
    title: 'Evaluación y seguimiento',
    body: (
      <>
        <Bullets title="Se tendrá en cuenta" items={plan.evaluation.criteria} />
        <p className="m-0"><strong>Informes de evolución:</strong> {frequencyLabel(plan.evaluation.reportsFrequency)}.</p>
        {plan.evaluation.notes?.trim() && <p className="m-0 whitespace-pre-line">{plan.evaluation.notes}</p>}
      </>
    ),
  });

  return (
    <article className="text-text">
      <header className="border-b border-border pb-5 text-center">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Acompañamiento terapéutico</p>
        <h2 className="m-0 mt-2 text-2xl font-bold">Plan de trabajo {year}</h2>
      </header>

      <div className="mt-6 space-y-7">
        {sections.map((section, index) => (
          <Section key={section.title + index} number={index + 1} title={section.title} subtitle={section.subtitle}>
            {section.body}
          </Section>
        ))}
      </div>

      <div className="mt-14 grid break-inside-avoid gap-10 text-center text-xs text-text-secondary sm:grid-cols-2">
        <div className="border-t border-text pt-2">Firma y aclaración del/de la AT</div>
        <div className="border-t border-text pt-2">Firma y sello del profesional / institución</div>
      </div>
    </article>
  );
}

// Copia del documento que solo se ve al imprimir: se coloca directamente en <body> para que no arrastre el diseño de la página
export function PrintablePlan(props) {
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div id="plan-print-root" className="hidden">
      <style>{PRINT_CSS}</style>
      <PlanDocumentContent {...props} />
    </div>,
    document.body,
  );
}
