import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

// Guardián de rutas privadas. Se usa como ruta contenedora: <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}/>}>.
// Sin allowedRoles alcanza con tener sesión. Protege la interfaz, pero el backend tiene que validar token y rol en cada endpoint
export default function ProtectedRoute ({ allowedRoles }) {
    const { user, isAuthenticated, isLoading } = useAuth ();
    const location = useLocation ();

    // Queda en true desde que este guardián ve una sesión iniciada. Distingue al visitante que llegó sin sesión
    // de la sesión que se terminó estando en una página privada (cierre de sesión, token vencido, cierre en otra pestaña)
    const [hadSession, setHadSession] = useState (isAuthenticated);

    if (isAuthenticated && !hadSession) setHadSession (true);

    // Mientras se verifica la sesión no se decide nada: redirigir ahora mandaría al login a alguien que sí tiene sesión
    if (isLoading) return <LoadingScreen/>;

    // Sin sesión: al login. La página pedida solo se recuerda (para volver después de iniciar sesión) si el visitante llegó sin sesión.
    // Si la sesión se terminó acá no se recuerda: el próximo en iniciar sesión puede ser otro usuario con otro rol, y mandarlo a la
    // página del anterior lo deja en /unauthorized o en una página que no es el inicio de su rol
    if (!isAuthenticated) return <Navigate to="/login" replace state={hadSession ? null : { from: location }}/>;

    // Con sesión pero sin permiso: la página privada no llega a montarse (ni pide datos al backend)
    if (allowedRoles && !allowedRoles.includes (user.role)) return <Navigate to="/unauthorized" replace/>;

    return <Outlet/>;
}
