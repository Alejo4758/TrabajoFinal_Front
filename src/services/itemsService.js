const BASE_URL = import.meta.env.VITE_API_URL;

export const getATs = async (page = 1, limit = 10, filters = {}) => {
    try {
        const url = new URL (`${BASE_URL}/ats/search`); // CAMBIAR LA RUTA POR EL ENDPOINT REAL 
        
        url.searchParams.append ("page", page);
        url.searchParams.append ("limit", limit);

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