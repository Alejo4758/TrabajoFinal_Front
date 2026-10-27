
import { useCallback, useEffect, useState } from "react";
import { getPendingATProfiles, reviewATProfile } from "../../services/adminService";
import ValidationList from "../../components/ValidationList/ValidationList";
import ValidationDetail from "../../components/ValidationDetail/ValidationDetail";
import Icon from "../../components/Icon/Icon";

export default function PanelAdmin() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPendingATProfiles();

      if (result.error) {
        setError(result.error);
      } else {
        setProfiles(result.data);
      }
    } catch (err) {
      setError(
        err.message || "No se pudieron cargar las solicitudes."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleReview = async (profileId, status, observations) => {
    setReviewing(true);
    setError(null);
    setSuccessMessage("");

    try {
      const result = await reviewATProfile(profileId, {
        status,
        observations,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      const approved = status === "APPROVED";

      setProfiles((previous) =>
        previous.filter((profile) => profile.id !== profileId)
      );

      setSelectedProfile(null);

      setSuccessMessage(
        approved
          ? "El profesional fue aprobado correctamente."
          : "La solicitud fue rechazada y se registró la decisión."
      );

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error:
          err.message ||
          "No se pudo registrar la decisión. Intentá nuevamente.",
      };
    } finally {
      setReviewing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background font-sans">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Gestión de profesionales
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            Validación de acompañantes
          </h2>
        </section>

        {/* Resumen */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Solicitudes pendientes */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-text-secondary">
                  Pendientes de revisión
                </p>

                <p className="mt-2 text-3xl font-extrabold text-text">
                  {loading ? "—" : profiles.length}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                <Icon
                  name="clock"
                  className="h-6 w-6"
                />
              </div>
            </div>
          </div>

          {/* Revisión documental */}
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon
                  name="plan"
                  className="h-6 w-6"
                />
              </div>

              <div>
                <p className="font-semibold text-text">
                  Revisión documental
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Verificá cada expediente antes de decidir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mensaje de resultado */}
        {successMessage && (
          <div
            role="status"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Cerrar mensaje"
              className="font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Error de carga o consulta */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{error}</p>

            {!selectedProfile && (
              <button
                type="button"
                onClick={loadProfiles}
                disabled={loading}
                className="mt-3 rounded-lg border border-red-200 px-3 py-2 font-semibold transition hover:bg-red-100 disabled:opacity-50"
              >
                {loading ? "Cargando..." : "Reintentar"}
              </button>
            )}
          </div>
        )}

        {/* Contenido principal */}
        {loading && profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />

            <p className="mt-4 text-sm text-text-secondary">
              Cargando solicitudes...
            </p>
          </div>
        ) : error && profiles.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-text-secondary">
              No se pudieron cargar las solicitudes.
            </p>
          </div>
        ) : selectedProfile ? (
          <ValidationDetail
            profile={selectedProfile}
            onBack={() => {
              if (!reviewing) {
                setSelectedProfile(null);
                setError(null);
              }
            }}
            onReview={handleReview}
            reviewing={reviewing}
          />
        ) : (
          <ValidationList
            profiles={profiles}
            onSelect={(profile) => {
              setSelectedProfile(profile);
              setError(null);
              setSuccessMessage("");
            }}
          />
        )}
      </div>
    </main>
  );
}
