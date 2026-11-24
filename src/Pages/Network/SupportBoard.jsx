import { Link, useSearchParams } from "react-router";
import { useMemo } from "react";

import { useContributions } from "../../hooks/useContributions";
import Contributions from "../../components/AT/Contributions/Contributions";
import { BOARD_TABS, TARGET_TYPES, formatWhen, planTarget, sessionLabel } from "../../utils/boardModel";
import { accessLabels, roleLabel } from "../../utils/networkModel";
import * as defaultContributionService from "../../services/contributonService";
import { ReportDocumentContent } from "../../components/AT/ReportEditor/PrintableReport";
import { periodLabel } from "../../utils/reportModel";

import Encounters from "../AT/PatientDetail/Tabs/Encounters";
import Evolution from "../AT/PatientDetail/Tabs/Evolution";
import BoardPlan from "./BoardPlan";

// Informes finalizados que el acompañante comparte con la red (vienen del backend solo con el acceso "reports").
// Cada uno se despliega con el mismo formato que la vista de impresión del AT
function BoardReports({ reports, patient, atName }) {
  if (reports.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface px-6 py-12 text-center">
        <h3 className="m-0 text-lg font-semibold">Todavía no hay informes</h3>
        <p className="mx-auto m-0 mt-2 max-w-lg text-sm text-text-secondary">
          Cuando el acompañante publique los informes del período, vas a poder leerlos acá.
        </p>
      </div>
    );
  }

  return (
    <ul className="m-0 list-none space-y-4 p-0">
      {reports.map((report) => (
        <li key={report.id}>
          <details className="group rounded-xl border border-border bg-surface">
            <summary className="cursor-pointer list-none p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <p className="m-0 font-semibold text-text">{report.title}</p>
              <p className="m-0 mt-1 text-sm text-text-secondary">
                Período: {periodLabel(report.periodFrom, report.periodTo)}
                <span className="ml-2 text-primary group-open:hidden">Leer informe</span>
              </p>
            </summary>
            <div className="border-t border-border p-5 sm:p-8">
              <ReportDocumentContent
                report={{ title: report.title, html: report.content, audience: report.audience, from: report.periodFrom, to: report.periodTo }}
                patient={patient}
                authorName={atName}
              />
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

const BOARD_TAB_OF = { plan: "plan", session: "encuentros", goal: "evolucion" };

const sessionTime = (session) => {
  const [y, m, d] = String(session.date).split("-").map(Number);
  const [h = 0, mi = 0] = String(session.time ?? "").split(":").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, h || 0, mi || 0).getTime();
};

const truncate = (text, max = 160) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

function Activity({ sessions, canSeeSessions, contributions, patientName }) {
  const feed = useMemo(() => {
    const fromSessions = canSeeSessions
      ? sessions.map((session) => ({
          id: `s-${session.id}`,
          time: sessionTime(session),
          tab: "encuentros",
          title: `${sessionLabel(session)} registrado`,
          detail: [
            `${(session.goals ?? []).length} ${(session.goals ?? []).length === 1 ? "objetivo trabajado" : "objetivos trabajados"}`,
            session.activities?.length ? `${session.activities.length} ${session.activities.length === 1 ? "actividad" : "actividades"}` : null,
          ].filter(Boolean).join(" · "),
        }))
      : [];

    const fromContributions = contributions.items
      .filter((item) => !item.hiddenAt)
      .map((item) => ({
        id: `c-${item.id}`,
        time: Date.parse(item.createdAt),
        tab: BOARD_TAB_OF[item.target.type],
        title: `${item.authorName} dejó un aporte`,
        detail: `Sobre ${item.target.label || TARGET_TYPES[item.target.type]?.label}`,
        quote: truncate(item.text),
        when: formatWhen(item.createdAt),
      }));

    return [...fromSessions, ...fromContributions].sort((a, b) => b.time - a.time).slice(0, 8);
  }, [sessions, canSeeSessions, contributions.items]);

  if (contributions.loading) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface-alt" role="status" aria-label="Cargando novedades" />;
  }

  return (
    <section aria-labelledby="activity-title" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h3 id="activity-title" className="m-0 text-lg font-semibold">Novedades</h3>
      <p className="m-0 mt-1 text-sm text-text-muted">Lo último del acompañamiento de {patientName}.</p>

      {feed.length === 0 ? (
        <p className="m-0 mt-5 rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-secondary">
          Todavía no hay novedades. Cuando haya encuentros registrados o aportes de la red, van a aparecer acá.
        </p>
      ) : (
        <ol className="m-0 mt-5 list-none space-y-3 p-0">
          {feed.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-border bg-background p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="m-0 text-sm font-semibold text-text">{entry.title}</p>
                {entry.when && <p className="m-0 text-xs text-text-muted">{entry.when}</p>}
              </div>
              <p className="m-0 mt-0.5 text-sm text-text-secondary">{entry.detail}</p>
              {entry.quote && (
                <blockquote className="m-0 mt-2 border-l-2 border-primary/30 pl-3 text-sm italic text-text-secondary">{entry.quote}</blockquote>
              )}
              {entry.tab && (
                <Link to={`?seccion=${entry.tab}`} replace className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                  Ver<span className="sr-only"> {entry.detail.toLowerCase()}</span>
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// data = { patient: { id, name }, atName, member: { name, role, relationship, access }, plan, sessions, reports }
// contributionService: para la vista previa del AT, que filtra los aportes como los vería el integrante
export default function SupportBoard({ data, viewer, canPost = true, banner = null, backLink = null, contributionService = defaultContributionService }) {
  const [searchParams] = useSearchParams();
  const { patient, atName, member, plan, sessions = [], reports = [] } = data;
  const access = member.access ?? [];

  const contributions = useContributions(patient.id, viewer, contributionService);

  const tabs = BOARD_TABS.filter((tab) => !tab.section || access.includes(tab.section));
  const activeTab = tabs.find((tab) => tab.id === searchParams.get("seccion")) ?? tabs[0];

  const renderThread = (target, options = {}) => (
    <Contributions contributions={contributions} target={target} canPost={canPost} {...options} />
  );

  const patientForTabs = { ...patient, plan, sessions };

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
      {banner}

      <header className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        {backLink && (
          <nav className="mb-5 text-sm text-text-muted" aria-label="Ruta de navegación">
            <Link to={backLink.to} className="hover:text-primary hover:underline">{backLink.label}</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-text">{backLink.current ?? patient.name}</span>
          </nav>
        )}
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tablero del acompañamiento</p>
        <h2 className="m-0 mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{patient.name}</h2>
        <dl className="m-0 mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Acompañante</dt>
            <dd className="m-0 mt-0.5">{atName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Participa como</dt>
            <dd className="m-0 mt-0.5">{member.relationship || roleLabel(member.role)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Puede ver</dt>
            <dd className="m-0 mt-0.5">{accessLabels(access).join(", ") || "Nada habilitado todavía"}</dd>
          </div>
        </dl>
      </header>

      <nav aria-label="Secciones del tablero" className="-mx-5 overflow-x-auto border-b border-border px-5 sm:mx-0 sm:px-0">
        <ul className="m-0 flex min-w-max list-none gap-1 p-0">
          {tabs.map((tab) => {
            const active = tab.id === activeTab.id;
            return (
              <li key={tab.id}>
                <Link
                  to={`?seccion=${tab.id}`}
                  replace
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                    active ? "border-primary text-primary" : "border-transparent text-text-secondary hover:text-text"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-label={activeTab.label}>
        {activeTab.id === "novedades" && (
          <Activity
            sessions={sessions}
            canSeeSessions={access.includes("sessions")}
            contributions={contributions}
            patientName={patient.name}
          />
        )}

        {activeTab.id === "plan" && (
          <div className="space-y-4">
            <BoardPlan plan={plan} />
            {plan && renderThread(planTarget())}
          </div>
        )}

        {activeTab.id === "encuentros" && (
          <Encounters patient={patientForTabs} sessions={sessions} readOnly renderThread={renderThread} />
        )}

        {activeTab.id === "evolucion" && (
          <Evolution patient={patientForTabs} sessions={sessions} readOnly renderThread={renderThread} />
        )}

        {activeTab.id === "informes" && <BoardReports reports={reports} patient={patient} atName={atName} />}
      </section>
    </main>
  );
}
