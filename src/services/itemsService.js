const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace (/\/+$/, "");

export const getATs = async (page = 1, limit = 10, filters = {}) => {
    try {
        const url = new URL (`${BASE_URL}/ats/search`);
        
        url.searchParams.append ("page", page);
        url.searchParams.append ("limit", limit);

        if (filters.province) {
            url.searchParams.append ("province", filters.province);
        }
        if (filters.department) {
            url.searchParams.append ("department", filters.department);
        }
        if (filters.locality) {
            url.searchParams.append ("locality", filters.locality);
        }   
        if (filters.specialties) {
            url.searchParams.append ("specialties", filters.specialties);
        }
        if (filters.socialPrograms) {
            url.searchParams.append ("socialPrograms", filters.socialPrograms);
        }

        const response = await fetch (url);

        if (response.status === 404) return { data: [], error: null };
        if (!response.ok) {
            console.error (`El backend rechazó el pedido: ${response.status}`);
            return { data: null, error: `Error del servidor: ${response.status}` };
        }

        const result = await response.json();
        
        return { data: result.data || result, error: null };

    }
    catch (error) {
        console.error ("Error en el fetch de ATs:", error);
        return { data: null, error: "Error de conexión con el servidor" };
    }
};

const getLocationOptions = async (path, params, label) => {
    try {
        const url = new URL (`${BASE_URL}${path}`);
        Object.entries (params).forEach (([key, value]) => {
            if (value) url.searchParams.set (key, value);
        });
        const response = await fetch (url);

        if (!response.ok) {
            console.error (`El backend rechazó el pedido de ${label}: ${response.status}`);
            return { data: null, error: `Error del servidor: ${response.status}` };
        }

        const result = await response.json ();
        const options = result.data ?? result;

        if (!Array.isArray (options) || !options.every (option => typeof option === "string")) {
            console.error (`El backend devolvió un formato inválido para ${label}`);
            return { data: null, error: `La respuesta del servidor para ${label} no es válida` };
        }

        return { data: options, error: null };
    }
    catch (error) {
        console.error (`Error al obtener ${label}:`, error);
        return { data: null, error: "Error de conexión con el servidor" };
    }
};

export const getProvinces = () => getLocationOptions ("/localities/provinces", {}, "provincias");

export const getDepartments = province =>
    getLocationOptions ("/localities/departments", { province }, "departamentos");

export const getLocalities = (province = "", department = "") =>
    getLocationOptions ("/localities", { province, department }, "localidades");

export const getFilterOptions = async () => {
    try {
        const response = await fetch (`${BASE_URL}/ats/filters-options`);

        if (!response.ok) {
            console.error (`El backend rechazó el pedido de opciones de filtros: ${response.status}`);
            return { data: null, error: `Error del servidor: ${response.status}` };
        }

        const result = await response.json ();
        const payload = result.data ?? result;

        // Transformamos los objetos { id, name } de Prisma en arrays de strings
        // para que funcionen igual que provinces/departments/localities en FilterBar.jsx
        return {
            data: {
                specialties: (payload.specialties || []).map (s => typeof s === "object" ? s.name : s),
                socialPrograms: (payload.socialPrograms || []).map (o => typeof o === "object" ? o.name : o),
                localities: (payload.localities || []).map (l => typeof l === "object" ? l.name : l),
            },
            error: null
        };
    }
    catch (error) {
        console.error ("Error al obtener opciones de filtros:", error);
        return { data: null, error: "Error de conexión con el servidor" };
    }
};

export const getATById = async id => {
    try {
        const response = await fetch (`${BASE_URL}/at/${id}`);

        if (!response.ok) {
            if (response.status === 404) {
                return { data: null, error: `Profesional no encontrado en la plataforma (ID: ${id})` };
            }
            return { data: null, error: `Error del servidor: ${response.status}` };
        }

        const result = await response.json ();

        return { data: result.data || result, error: null };

    }
    catch (error) {
        return { data: null, error: "Error de conexión con la API" };
    }
};