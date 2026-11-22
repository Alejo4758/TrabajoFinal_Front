import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";

import { useAuth } from "../../hooks/useAuth";
import { getMyNetworks } from "../../services/boardService";
import { accessLabels, roleLabel } from "../../utils/networkModel";

export default function NetworkHome() {
  const { token, user } = useAuth();
  const [state, setState] = useState({ status: "loading", items: [], error: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", items: [], error: "" });
    getMyNetworks(token)
      .then((items) => !cancelled && setState({ status: "ready", items: items ?? [], error: "" }))
      .catch((err) => !cancelled && setState({ status: "error", items: [], error: err.message || "No pudimos cargar tus acompañamientos." }));
    return () => { cancelled = true; };
  }, [token, attempt]);

  if (state.status === "ready" && state.items.length === 1) {
    return <Navigate to={`/red/${state.items[0].patientId}`} replace />;
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5 sm:p-8">
      <header>
        <h2 className="m-0 text-2xl font-bold tracking-tight sm:text-3xl">Hola{user?.name ? `, ${user.name}` : ""}</h2>
        <p className="m-0 mt-2 text-text-secondary">Estos son los acompañamientos en los que formás parte de la red de apoyo.</p>
      </header>

      {state.status === "loading" && (
        <div className="grid gap-4 sm:grid-cols-2" role="status" aria-label="Cargando tus acompañamientos">
          {[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-alt" />)}
        </div>
      )}

      {state.status === "error" && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="m-0 text-sm text-red-600">{state.error}</p>
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="mt-4 cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
            Reintentar
          </button>
        </div>
      )}

      {state.status === "ready" && state.items.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <h3 className="m-0 text-lg font-semibold">Todavía no participás de ningún acompañamiento</h3>
          <p className="mx-auto m-0 mt-2 max-w-lg text-sm text-text-secondary">
            Cuando un acompañante te invite a la red de apoyo de una persona y aceptes la invitación, vas a verla acá.
          </p>
        </div>
      )}

      {state.status === "ready" && state.items.length > 1 && (
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
          {state.items.map((item) => (
            <li key={item.patientId}>
              <Link
                to={`/red/${item.patientId}`}
                className="block h-full rounded-xl border border-border bg-surface p-5 transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <p className="m-0 text-lg font-semibold text-text">{item.patientName}</p>
                <p className="m-0 mt-1 text-sm text-text-secondary">Acompañante: {item.atName}</p>
                <p className="m-0 mt-3 text-sm text-text-muted">Participás como {item.relationship || roleLabel(item.role)}</p>
                <p className="m-0 mt-1 text-sm text-text-muted">Podés ver: {accessLabels(item.access).join(", ") || "nada habilitado"}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-primary">Abrir tablero →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}