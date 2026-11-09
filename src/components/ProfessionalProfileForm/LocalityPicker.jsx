import { useEffect, useRef, useState } from "react";
import { getDepartments, getProvinces } from "../../services/itemsService";
import { getLocalityOptions } from "../../services/profileATService";
import { SELECT_CLASS } from "./formShared";

// Zonas de trabajo del A.T.: se elige provincia, departamento y localidad, y se agrega a la lista.
// value = [{ id, name, departmentName, provinceName }]. Se guarda el id: el nombre de una localidad se repite entre departamentos
export default function LocalityPicker ({ value, onChange, max }) {
    const [provinces, setProvinces] = useState ([]);
    const [departments, setDepartments] = useState ([]);
    const [localities, setLocalities] = useState ([]);
    const [province, setProvince] = useState ("");
    const [department, setDepartment] = useState ("");
    const [localityId, setLocalityId] = useState ("");
    // Qué lista se está cargando: "provinces", "departments", "localities" o ""
    const [loading, setLoading] = useState ("provinces");
    const [error, setError] = useState ("");

    // Si se cambia de provincia o departamento antes de que llegue una respuesta, la vieja se descarta
    const requestId = useRef (0);

    useEffect (() => {
        let cancelled = false;

        getProvinces ().then (result => {
            if (cancelled) return;
            setLoading ("");
            if (result.error) setError (`No se pudieron cargar las provincias. ${result.error}`);
            else setProvinces (result.data);
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const handleProvince = event => {
        const next = event.target.value;
        const id = ++requestId.current;

        setProvince (next);
        setDepartment ("");
        setDepartments ([]);
        setLocalities ([]);
        setLocalityId ("");
        setError ("");

        if (!next) {
            setLoading ("");
            return;
        }

        setLoading ("departments");
        getDepartments (next).then (result => {
            if (id !== requestId.current) return;
            setLoading ("");
            if (result.error) setError (`No se pudieron cargar los departamentos. ${result.error}`);
            else setDepartments (result.data);
        });
    };

    const handleDepartment = event => {
        const next = event.target.value;
        const id = ++requestId.current;

        setDepartment (next);
        setLocalities ([]);
        setLocalityId ("");
        setError ("");

        if (!next) {
            setLoading ("");
            return;
        }

        setLoading ("localities");
        getLocalityOptions (province, next).then (result => {
            if (id !== requestId.current) return;
            setLoading ("");
            if (result.error) setError (`No se pudieron cargar las localidades. ${result.error}`);
            else setLocalities (Array.isArray (result.data) ? result.data : []);
        });
    };

    const selected = new Set (value.map (locality => locality.id));
    const available = localities.filter (locality => !selected.has (locality.id));
    const full = value.length >= max;

    const add = () => {
        const locality = available.find (item => String (item.id) === localityId);
        if (!locality || full) return;
        onChange ([...value, locality]);
        setLocalityId ("");
    };

    const remove = id => onChange (value.filter (locality => locality.id !== id));

    return (
        <div className="space-y-4">
            {value.length > 0 ? (
                <ul className="flex flex-wrap gap-2" aria-label="Zonas de trabajo elegidas">
                    {value.map (locality => (
                        <li key={locality.id} className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 py-1 pl-3 pr-1 text-sm">
                            <span>
                                {locality.name}
                                <span className="text-text-muted">{` · ${[locality.departmentName, locality.provinceName].filter (Boolean).join (", ")}`}</span>
                            </span>
                            <button type="button" onClick={() => remove (locality.id)} aria-label={`Quitar ${locality.name}`} className="grid size-6 cursor-pointer place-items-center rounded-full text-text-secondary transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-primary/30">
                                <span aria-hidden="true">×</span>
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-text-muted">Todavía no agregaste zonas de trabajo.</p>
            )}

            {full ? (
                <p className="text-sm text-text-secondary">Llegaste al máximo de {max} zonas. Quitá alguna para agregar otra.</p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <div>
                        <label htmlFor="zone-province" className="mb-1.5 block text-xs font-medium text-text-secondary">Provincia</label>
                        <select id="zone-province" value={province} onChange={handleProvince} disabled={loading === "provinces"} className={SELECT_CLASS}>
                            <option value="">{loading === "provinces" ? "Cargando..." : "Elegí una provincia"}</option>
                            {provinces.map (item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="zone-department" className="mb-1.5 block text-xs font-medium text-text-secondary">Departamento</label>
                        <select id="zone-department" value={department} onChange={handleDepartment} disabled={!province || loading === "departments"} className={SELECT_CLASS}>
                            <option value="">{!province ? "Elegí una provincia primero" : loading === "departments" ? "Cargando..." : "Elegí un departamento"}</option>
                            {departments.map (item => <option key={item} value={item}>{item}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="zone-locality" className="mb-1.5 block text-xs font-medium text-text-secondary">Localidad</label>
                        <select id="zone-locality" value={localityId} onChange={event => setLocalityId (event.target.value)} disabled={!department || loading === "localities"} className={SELECT_CLASS}>
                            <option value="">{!department ? "Elegí un departamento primero" : loading === "localities" ? "Cargando..." : available.length ? "Elegí una localidad" : "Ya agregaste todas"}</option>
                            {available.map (item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                    <button type="button" onClick={add} disabled={!localityId} className="cursor-pointer rounded-md border border-border px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60">
                        Agregar
                    </button>
                </div>
            )}

            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
