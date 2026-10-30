import { Navigate, useLocation } from "react-router";
import { getSession } from "../../services/authService";
import { ROLE_ROUTES, DEFAULT_ROUTE } from "../../utils/constants";

// Solo muestra la página si hay una sesión iniciada y, si se indican roles, si el usuario tiene alguno de ellos.
// Es una protección de la interfaz: el backend también tiene que validar el token en cada endpoint.
export default function ProtectedRoute ({ roles, children }) {
    const location = useLocation ();
    const session = getSession ();

    // Sin sesión: al login, recordando la página pedida para volver después de iniciar sesión.
    if (!session) return <Navigate to="/login" replace state={{ from: location }}/>;

    // Con sesión pero sin permiso: a la página de inicio de su rol.
    if (roles && !roles.includes (session.user.role)) return <Navigate to={ROLE_ROUTES[session.user.role] ?? DEFAULT_ROUTE} replace/>;

    return children;
}
