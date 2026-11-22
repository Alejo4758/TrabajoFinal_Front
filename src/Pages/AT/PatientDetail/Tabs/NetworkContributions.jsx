import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ContributionComposer, ContributionItem } from "../../../../components/AT/Contributions/Contributions";
import { TARGET_TYPES } from "../../../../utils/boardModel";

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "plan", label: "Plan de trabajo" },
  { id: "session", label: "Encuentros" },
  { id: "goal", label: "Evolución" },
  { id: "hidden", label: "Ocultos" },
];

export default function NetworkContributions({ contributions }) {
  const [filter, setFilter] = useState("all");
  const marked = useRef(false);

  useEffect(() => {
    if (contributions.loading || marked.current) return;
    marked.current = true;
    contributions.markSeen();
  }, [contributions.loading, contributions]);

  const newCount = contributions.items.filter(contributions.isNew).length;

  const visible = useMemo(() => {
    const list = contributions.items.filter((item) => {
      if (filter === "hidden") return Boolean(item.hiddenAt);
      if (filter !== "all") return item.target.type === filter;
      return true;
    });
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [contributions.items, filter]);

  if (contributions.loading) {
    return (
      <div className="animate-pulse space-y-3" role="status" aria-label="Cargando los aportes">
        {[0, 1, 2].map((i) => <div key={i} className="h-24 rounded-xl bg-surface-alt" />)}
      </div>
    );
  }

  if (contributions.error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="m-0 text-sm text-red-600">{contributions.error}</p>
        <button type="button" onClick={() => contributions.reload()} className="mt-4 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
          Reintentar
        </button>
      </div>
    );
  }

  if (contributions.items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <h3 className="m-0 text-lg font-semibold">Todavía no hay aportes de la red</h3>
        <p className="mx-auto m-0 mt-2 max-w-lg text-sm text-text-secondary">
          Cuando los integrantes de la red de apoyo dejen observaciones sobre el plan, los encuentros o la evolución,
          van a aparecer acá para que puedas leerlas y responderlas.
        </p>
        <Link to="?tab=supportNetwork" replace className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
          Ir a la red de apoyo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <h3 className="m-0 text-lg font-semibold">Aportes de la red de apoyo</h3>
          <p className="m-0 mt-1 text-sm text-text-muted">
            {contributions.items.length} {contributions.items.length === 1 ? "aporte" : "aportes"}
            {newCount > 0 && ` · ${newCount} ${newCount === 1 ? "nuevo" : "nuevos"} desde tu última visita`}
          </p>
        </div>
        <div>
          <label htmlFor="contributions-filter" className="mb-1.5 block text-sm font-medium">Mostrar</label>
          <select
            id="contributions-filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm sm:w-56"
          >
            {FILTERS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </div>
      </section>

      <p className="sr-only" role="status">{visible.length === 1 ? "1 aporte" : `${visible.length} aportes`}</p>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-text-secondary">
          No hay aportes con ese filtro.
        </p>
      ) : (
        <ol className="m-0 list-none space-y-3 p-0">
          {visible.map((item) => {
            const type = TARGET_TYPES[item.target.type];
            return (
              <ContributionItem
                key={item.id}
                item={item}
                contributions={contributions}
                highlight={contributions.isNew(item)}
                context={
                  <p className="m-0 mb-1 text-xs text-text-muted">
                    Sobre{" "}
                    <Link to={`?tab=${type?.tab ?? "summary"}`} replace className="font-semibold text-primary hover:underline">
                      {item.target.label || type?.label}
                    </Link>
                  </p>
                }
              />
            );
          })}
        </ol>
      )}

      {visible.length > 0 && filter !== "hidden" && (
        <ReplyBox contributions={contributions} items={visible} />
      )}
    </div>
  );
}

function ReplyBox({ contributions, items }) {
  const targets = useMemo(() => {
    const unique = new Map();
    items.forEach((item) => {
      const key = `${item.target.type}:${item.target.id}`;
      if (!unique.has(key)) unique.set(key, item.target);
    });
    return [...unique.entries()];
  }, [items]);

  const [selected, setSelected] = useState(targets[0]?.[0] ?? "");
  const target = targets.find(([key]) => key === selected)?.[1] ?? targets[0]?.[1];

  if (!target) return null;

  return (
    <section aria-labelledby="reply-title" className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h3 id="reply-title" className="m-0 text-base font-semibold">Responder a la red</h3>
      <p className="m-0 mt-1 text-sm text-text-muted">Tu respuesta queda en el hilo del registro y la ven quienes tienen acceso a esa sección.</p>
      {targets.length > 1 && (
        <div className="mt-4">
          <label htmlFor="reply-target" className="mb-1.5 block text-sm font-medium">Registro</label>
          <select id="reply-target" value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm">
            {targets.map(([key, t]) => <option key={key} value={key}>{t.label || TARGET_TYPES[t.type]?.label}</option>)}
          </select>
        </div>
      )}
      <ContributionComposer key={selected} target={target} contributions={contributions} label="Escribir una respuesta" />
    </section>
  );
}