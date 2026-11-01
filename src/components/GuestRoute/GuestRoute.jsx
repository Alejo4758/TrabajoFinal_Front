import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_ROUTES, DEFAULT_ROUTE } from "../../utils/constants";
import LoadingScreen from "../LoadingScreen/LoadingScreen";

// Solo se vuelve a rutas internas de la app, nunca a una dirección de otro sitio
const getReturnPath = from => {
    const pathname = from?.pathname;

    if (typeof pathname !== "string" || !pathname.startsWith ("/") || pathname.startsWith ("//")) return null;

    return `${pathname}${from.search ?? ""}`;
};

// Rutas solo para visitantes (login y registro). Con sesión iniciada lleva a la página de la que venía el usuario o al inicio de su rol.
// También hace la redirección después del login: al guardarse la sesión este componente se vuelve a renderizar y navega.
// Que la haga un solo lugar evita dos navegaciones compitiendo entre sí
export default function GuestRoute () {
    const { user, isAuthenticated, isLoading } = useAuth ();
    const location = useLocation ();

    if (isLoading) return <LoadingScreen/>;

    if (isAuthenticated) return <Navigate to={getReturnPath (location.state?.from) ?? ROLE_ROUTES[user.role] ?? DEFAULT_ROUTE} replace/>;

    return <Outlet/>;
}
