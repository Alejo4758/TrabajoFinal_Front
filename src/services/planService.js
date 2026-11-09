// Servicio del plan de trabajo.

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

// Guarda el plan de trabajo del paciente (como borrador o vigente) y devuelve el plan guardado, con su id.
// El plan es del acompañamiento entre ese paciente y el AT logueado (el AT sale del token): hay uno solo y cada guardado lo reemplaza.
// El backend vuelve a validar la estructura y que el paciente sea de ese AT. Lanza un Error con el mensaje para mostrar si algo falla
export async function savePlan (patientId, plan, token) {
    if (!token) throw new Error ("Tenés que iniciar sesión para guardar el plan");

    let res;
    try {
        res = await fetch (`${BASE_URL}/api/at/patients/${encodeURIComponent (patientId)}/plan`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify (plan),
        });
    }
    catch {
        throw new Error ("Error de conexión con el backend. Intentá nuevamente");
    }

    const body = await res.json ().catch (() => null);

    if (!res.ok) throw new Error (body?.message || body?.error || "No pudimos guardar el plan.");

    return body?.data ?? body;
}
