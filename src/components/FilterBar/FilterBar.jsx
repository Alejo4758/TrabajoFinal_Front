import { useEffect, useState } from "react";
import { 
    getDepartments, 
    getLocalities, 
    getProvinces, 
    getFilterOptions 
} from "../../services/itemsService";

export default function FilterBar ({ filters, onApply, disabled = false }) {
    const [form, setForm] = useState (filters);
    const [provinces, setProvinces] = useState ([]);
    const [departments, setDepartments] = useState ([]);
    const [localities, setLocalities] = useState ([]);
    const [specialties, setSpecialties] = useState ([]);
    const [socialPrograms, setSocialPrograms] = useState ([]);

    const [provincesLoading, setProvincesLoading] = useState (true);
    const [departmentsLoading, setDepartmentsLoading] = useState (false);
    const [localitiesLoading, setLocalitiesLoading] = useState (false);
    const [optionsLoading, setOptionsLoading] = useState (true);

    const [provincesError, setProvincesError] = useState (null);
    const [departmentsError, setDepartmentsError] = useState (null);
    const [localitiesError, setLocalitiesError] = useState (null);
    const [optionsError, setOptionsError] = useState (null);

    useEffect (() => { setForm (filters); }, [filters]);

    // Cargar Provincias y Opciones de BD (Especialidades + Obras Sociales) en paralelo
    useEffect (() => {
        let cancelled = false;

        const fetchInitialData = async () => {
            const [provResult, optionsResult] = await Promise.all ([
                getProvinces (),
                getFilterOptions ()
            ]);

            if (cancelled) return;

            if (provResult.error) {
                setProvincesError (provResult.error);
            } else {
                setProvinces (provResult.data);
            }
            setProvincesLoading (false);

            if (optionsResult.error) {
                setOptionsError (optionsResult.error);
            } else {
                setSpecialties (optionsResult.data.specialties);
                setSocialPrograms (optionsResult.data.socialPrograms);
            }
            setOptionsLoading (false);
        };

        fetchInitialData ();

        return () => { cancelled = true; };
    }, []);

    useEffect (() => {
        let cancelled = false;

        const fetchDepartments = async () => {
            if (!form.province) {
                setDepartmentsLoading (false);
                return;
            }

            setDepartmentsLoading (true);
            setDepartmentsError (null);
            const result = await getDepartments (form.province);

            if (cancelled) return;

            if (result.error) {
                setDepartmentsError (result.error);
            } else {
                setDepartments (result.data);
            }
            setDepartmentsLoading (false);
        };

        fetchDepartments ();

        return () => { cancelled = true; };
    }, [form.province]);

    useEffect (() => {
        let cancelled = false;

        const fetchLocalities = async () => {
            if (!form.province || !form.department) {
                setLocalitiesLoading (false);
                return;
            }

            setLocalitiesLoading (true);
            setLocalitiesError (null);
            const result = await getLocalities (form.province, form.department);

            if (cancelled) return;

            if (result.error) {
                setLocalitiesError (result.error);
            } else {
                setLocalities (result.data);
            }
            setLocalitiesLoading (false);
        };

        fetchLocalities ();

        return () => { cancelled = true; };
    }, [form.province, form.department]);

    const handleChange = event => {
        const { name, value } = event.target;

        if (name === "province") {
            setDepartments ([]);
            setLocalities ([]);
            setDepartmentsError (null);
            setLocalitiesError (null);
            setForm (previous => ({ ...previous, province: value, department: "", locality: "" }));
            return;
        }

        if (name === "department") {
            setLocalities ([]);
            setLocalitiesError (null);
            setForm (previous => ({ ...previous, department: value, locality: "" }));
            return;
        }

        setForm ((prevForm) => ({ ...prevForm, [name]: value }));
    };

    const handleSubmit = event => {
        event.preventDefault ();
        onApply (form);
    };

    const clearFilters = () => {
        const emptyFilters = {
            province: "",
            department: "",
            locality: "",
            specialties: "",
            socialPrograms: "",
        };
        setForm (emptyFilters);
        onApply (emptyFilters);
    };

    return (
        <form className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface p-5 md:grid-cols-2 lg:grid-cols-4" onSubmit={handleSubmit}>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="province">
                    Provincia
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" id="province" name="province" value={form.province || ""} onChange={handleChange} disabled={provincesLoading || Boolean(provincesError)}>
                    <option value="">
                        {provincesLoading ? "Cargando provincias..." : "Todas las provincias"}
                    </option>
                    {provinces.map (province => (
                        <option key={province} value={province}>
                            {province}
                        </option>
                    ))}
                </select>
                {provincesError && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                        No se pudieron cargar las provincias. {provincesError}
                    </p>
                )}
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="department">
                    Departamento
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" id="department" name="department" value={form.department || ""} onChange={handleChange} disabled={!form.province || departmentsLoading || Boolean(departmentsError)}>
                    <option value="">
                        {!form.province ? "Elegí una provincia primero" : departmentsLoading ? "Cargando departamentos..." : "Todos los departamentos"}
                    </option>
                    {departments.map (department => (
                        <option key={department} value={department}>
                            {department}
                        </option>
                    ))}
                </select>
                {departmentsError && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                        No se pudieron cargar los departamentos. {departmentsError}
                    </p>
                )}
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="locality">
                    Localidad
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" id="locality" name="locality" value={form.locality || ""} onChange={handleChange} disabled={!form.department || localitiesLoading || Boolean(localitiesError)}>
                    <option value="">
                        {!form.department ? "Elegí un departamento primero" : localitiesLoading ? "Cargando localidades..." : "Todas las localidades"}
                    </option>
                    {localities.map (locality => (
                        <option key={locality} value={locality}>
                            {locality}
                        </option>
                    ))}
                </select>
                {localitiesError && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                        No se pudieron cargar las localidades. {localitiesError}
                    </p>
                )}
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="specialties">
                    Especialidad
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" id="specialties" name="specialties" value={form.specialties || ""} onChange={handleChange} disabled={optionsLoading || Boolean(optionsError)}>
                    <option value="">
                        {optionsLoading ? "Cargando especialidades..." : "Todas las especialidades"}
                    </option>
                    {specialties.map (specialty => (
                        <option key={specialty} value={specialty}>
                            {specialty}
                        </option>
                    ))}
                </select>
                {optionsError && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                        No se pudieron cargar las especialidades. {optionsError}
                    </p>
                )}
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-text" htmlFor="socialPrograms">
                    Obra social
                </label>
                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-text outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" id="socialPrograms" name="socialPrograms" value={form.socialPrograms || ""} onChange={handleChange} disabled={optionsLoading || Boolean(optionsError)}>
                    <option value="">
                        {optionsLoading ? "Cargando obras sociales..." : "Todas las obras sociales"}
                    </option>
                    {socialPrograms.map (program => (
                        <option key={program} value={program}>
                            {program}
                        </option>
                    ))}
                </select>
                {optionsError && (
                    <p className="mt-2 text-sm text-red-600" role="alert">
                        No se pudieron cargar las obras sociales. {optionsError}
                    </p>
                )}
            </div>
            <div className="flex items-end gap-2">
                <button className="flex-1 cursor-pointer rounded-xl bg-primary px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={disabled}>
                    Buscar
                </button>
                <button className="cursor-pointer rounded-xl border border-border px-4 py-2.5 font-medium text-text transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={clearFilters} disabled={disabled}>
                    Limpiar
                </button>
            </div>
        </form>
    );
}