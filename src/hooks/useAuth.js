import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const useAuth = () => {
    const context = useContext (AuthContext);

    // Falla enseguida si se usa fuera del provider, en vez de tratar al usuario como "sin sesión" sin avisar
    if (!context) throw new Error ("useAuth tiene que usarse dentro de <AuthProvider>");

    return context;
};
