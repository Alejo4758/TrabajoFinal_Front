import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { ROLE_ROUTES, DEFAULT_ROUTE } from "../../utils/constants";

export default function NotFound () {
  const { user } = useAuth ();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 font-sans">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-text">
          No encontramos esta página
        </h1>
        <p className="mt-3 text-text-secondary">
          Puede que la dirección esté mal escrita o que la página ya no exista.
        </p>
        <Link to={ROLE_ROUTES[user?.role] ?? DEFAULT_ROUTE} className="mt-8 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
