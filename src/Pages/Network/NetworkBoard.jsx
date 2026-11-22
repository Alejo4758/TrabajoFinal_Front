import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { useAuth } from "../../hooks/useAuth";
import { getBoard } from "../../services/boardService";
import SupportBoard from "./SupportBoard";

export default function NetworkBoard() {
  const { patientId } = useParams();
  const { token, user } = useAuth();
  const [state, setState] = useState({ status: "loading", data: null, error: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", data: null, error: "" });
    getBoard(patientId, token)
      .then((data) => !cancelled && setState({ status: "ready", data, error: "" }))
      .catch((err) => !cancelled && setState({ status: "error", data: null, error: err.message || "No pudimos cargar el tablero." }));
    return () => { cancelled = true; };
  }, [patientId, token, attempt]);

  const member = state.data?.member;

  // Quién escribe. En el backend el autor sale del token: estos datos son solo para mostrar el aporte enseguida
  const viewer = useMemo(() => user && member && ({
    key: `user:${user.id}`,
    name: [user.name, user.lastName].filter(Boolean).join(" ") || member.name,
    role: member.role,
    relationship: member.relationship,
    isAT: false,
    sections: member.access ?? [],
  }), [user, member]);

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8" aria-busy="true">
        <div className="h-40 animate-pulse rounded-xl bg-surface-alt" />
        <div className="h-72 animate-pulse rounded-xl bg-surface-alt" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-3xl p-5 sm:p-8">
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="m-0 text-sm text-red-600">{state.error}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
              Reintentar
            </button>
            <Link to="/red" className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-alt">
              Mis acompañamientos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <SupportBoard data={state.data} viewer={viewer} backLink={{ to: "/red", label: "Mis acompañamientos" }} />;
}
