// Servicio del plan de trabajo.
// IMPORTANTE: por ahora SIMULA el backend. Si ya tenés un servicio de pacientes, podés mover esta función ahí.

const API_URL = import.meta.env?.VITE_API_URL ?? "http://localhost:3000/api";

const wait = (ms) => new Promise ((resolve) => setTimeout (resolve, ms));

// Guarda el plan de trabajo del paciente (como borrador o vigente) y devuelve el plan guardado.
export async function savePlan (patientId, plan) {
    // TODO (backend):
    // const res = await fetch (`${API_URL}/at/patients/${patientId}/plan`, {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem ("token")}` },
    //     body: JSON.stringify (plan),
    // });
    // const data = await res.json ().catch (() => ({}));
    // if (!res.ok) throw new Error (data.message || "No pudimos guardar el plan.");
    // return data; // el plan guardado
    //
    // El backend debe validar la estructura (ver PlanWizard/planModel.js) y que el paciente pertenezca al AT autenticado.
    void API_URL;
    await wait (700);
    return { ...plan, id: plan.id ?? Date.now (), updatedAt: new Date ().toISOString () };
}
