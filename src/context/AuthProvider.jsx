import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { login as loginRequest, getSession, saveSession, clearSession } from "../services/authService";

// setTimeout no admite demoras mayores a ~24,8 días (más allá dispara de inmediato)
const MAX_TIMEOUT = 2 ** 31 - 1;

// Lee la sesión guardada. Si está vencida, corrupta o fue manipulada, la borra para que no quede un token inválido en el navegador
const restoreSession = () => {
    const session = getSession ();

    if (!session) clearSession ();

    return session;
};

export default function AuthProvider ({ children }) {
    // La sesión se lee de forma sincrónica en el primer render. Así no existe un instante "sin usuario" al recargar la página
    // que haga que los guardias manden al login a alguien que sí tenía sesión
    const [session, setSession] = useState (restoreSession);

    const login = useCallback (async credentials => {
        const { token, user } = await loginRequest (credentials);

        saveSession (token, user);

        // Se valida lo guardado con las mismas reglas que al recargar: solo se acepta si el token y el usuario son coherentes
        const newSession = restoreSession ();

        if (!newSession) throw new Error ("No se pudo iniciar sesión. Intentá nuevamente");

        setSession (newSession);

        return newSession.user;
    }, []);

    const logout = useCallback (() => {
        clearSession ();
        setSession (null);
    }, []);

    // Cierra la sesión cuando vence el token, sin esperar a que el usuario recargue la página
    useEffect (() => {
        if (!session?.expiresAt) return;

        const timeout = setTimeout (() => setSession (restoreSession ()), Math.min (session.expiresAt - Date.now (), MAX_TIMEOUT));

        return () => clearTimeout (timeout);
    }, [session]);

    // Mantiene las pestañas sincronizadas: si en otra se cierra o se cambia la sesión, esta se actualiza
    useEffect (() => {
        const handleStorage = event => {
            if (event.key === null || event.key === "token" || event.key === "user") setSession (restoreSession ());
        };

        window.addEventListener ("storage", handleStorage);

        return () => window.removeEventListener ("storage", handleStorage);
    }, []);

    const value = useMemo (() => ({
        user: session?.user ?? null,
        token: session?.token ?? null,
        isAuthenticated: Boolean (session),
        // Hoy la sesión se restaura de forma sincrónica y nunca hay espera. Si más adelante se valida el token contra
        // el backend al iniciar, alcanza con poner esto en true mientras tanto: los guardias ya muestran la pantalla de carga
        isLoading: false,
        login,
        logout,
    }), [session, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
