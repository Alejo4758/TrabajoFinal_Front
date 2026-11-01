import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

// Guardián de rutas privadas. Se usa como ruta contenedora: <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}/>}>.
// Sin allowedRoles alcanza con tener sesión. Protege la interfaz, pero el backend tiene que validar token y rol en cada endpoint
export default function ProtectedRoute ({ allowedRoles }) {
    const { user, isAuthenticated, isLoading } = useAuth ();
    const location = useLocation ();

    // Mientras se verifica la sesión no se decide nada: redirigir ahora mandaría al login a alguien que sí tiene sesión
    if (isLoading) return <LoadingScreen/>;

    // Sin sesión: al login, recordando la página pedida para volver después de iniciar sesión
    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }}/>;

    // Con sesión pero sin permiso: la página privada no llega a montarse (ni pide datos al backend)
    if (allowedRoles && !allowedRoles.includes (user.role)) return <Navigate to="/unauthorized" replace/>;

    return <Outlet/>;
}
