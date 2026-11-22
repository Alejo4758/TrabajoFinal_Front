import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { useAuth } from "../../../hooks/useAuth";
import { getPatient } from "../../../services/patientService";
import { listNetwork } from "../../../services/networkService";
import { memberStatus } from "../../../utils/networkModel";
import { scopeBoardData } from "../../../utils/boardModel";
import SupportBoard from "../../Network/SupportBoard";

const CAN_SIMULATE = Boolean(import.meta.env?.DEV);

export default function BoardPreview() {
  const { id, memberId } = useParams();
  const { token, user } = useAuth();
  const [state, setState] = useState({ status: "loading", error: "", patient: null, member: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", error: "", patient: null, member: null });

    Promise.all([getPatient(id, token), listNetwork(id)])
      .then(([patient, network]) => {
        if (cancelled) return;
        const member = network.find((m) => String(m.id) === String(memberId));
        if (!member) throw new Error("Esa persona ya no forma parte de la red de apoyo.");
        if (memberStatus(member) !== "active") throw new Error("Esa persona todavía no aceptó la invitación: va a poder ver el tablero cuando cree su cuenta.");
        setState({ status: "ready", error: "", patient, member });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", error: err.message || "No pudimos cargar el tablero.", patient: null, member: null });
      });

    return () => { cancelled = true; };
  }, [id, memberId, token]);

  const { patient, member } = state;

  const data = useMemo(() => {
    if (!patient || !member) return null;
    const scoped = scopeBoardData(patient, member.access);
    return {
      patient: { id: scoped.id, name: scoped.name },
      atName: [user?.name, user?.lastName].filter(Boolean).join(" "),
      member: { name: member.name || member.email, role: member.role, relationship: member.relationship, access: member.access },
      plan: scoped.plan,
      sessions: scoped.sessions,
    };
  }, [patient, member, user]);

  const viewer = useMemo(() => member && ({
    key: `member:${member.id}`,
    name: member.name || member.email,
    role: member.role,
    relationship: member.relationship,
    isAT: false,
    sections: member.access,
  }), [member]);

  const backTo = `/patient/${id}?tab=supportNetwork`;

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8" aria-busy="true">
        <div className="h-16 animate-pulse rounded-xl bg-surface-alt" />
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
          <Link to={backTo} className="mt-4 inline-block rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold hover:bg-surface-alt">
            Volver a la red de apoyo
          </Link>
        </div>
      </main>
    );
  }

  const banner = (
    <div role="note" className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="m-0 font-semibold">Vista previa: así ve el tablero {data.member.name}</p>
        <p className="m-0 mt-1">
          {CAN_SIMULATE
            ? `Modo de prueba (solo en desarrollo): los aportes que publiques acá quedan a nombre de ${data.member.name}.`
            : "Ves las mismas secciones que esta persona. Desde acá no se publican aportes: respondelos desde la ficha del paciente."}
        </p>
      </div>
      <Link to={backTo} className="shrink-0 rounded-lg border border-amber-400 bg-white px-4 py-2 text-center font-semibold text-amber-900 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
        Salir de la vista previa
      </Link>
    </div>
  );

  return (
    <SupportBoard
      data={data}
      viewer={viewer}
      canPost={CAN_SIMULATE}
      banner={banner}
      backLink={{ to: backTo, label: patient.name, current: `Tablero de ${data.member.name}` }}
    />
  );
}