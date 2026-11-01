import { createContext } from "react";

// Estado de la sesión. Lo provee <AuthProvider> y se lee con el hook useAuth
export const AuthContext = createContext (null);
