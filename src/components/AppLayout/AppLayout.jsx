import { Outlet } from "react-router";
import Navbar from "../Navbar/Navbar";

// Estructura común de las páginas con sesión: la barra de navegación arriba y la página debajo. Se usa como ruta contenedora
// dentro de ProtectedRoute, así la barra siempre tiene un usuario y queda montada al pasar de una página a otra
export default function AppLayout () {
    return (
        <div className="min-h-dvh bg-background">
            <Navbar/>
            <Outlet/>
        </div>
    );
}
