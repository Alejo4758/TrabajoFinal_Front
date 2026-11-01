import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_ROUTES, DEFAULT_ROUTE } from "../../utils/constants";
import Icon from "../../components/Icon/Icon";

export default function Unauthorized () {
  const { user } = useAuth ();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 font-sans">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="lock" className="h-7 w-7"/>
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text">
          No tenés acceso a esta página
        </h1>
        <p className="mt-3 text-text-secondary">
          Tu cuenta no tiene permisos para ver esta sección.
        </p>
        <Link to={ROLE_ROUTES[user?.role] ?? DEFAULT_ROUTE} className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover">
          Ir a mi inicio
        </Link>
      </div>
    </main>
  );
}
