import { useMemo, useState } from "react";
import Icon from "../Icon/Icon";
import { formatDateList } from "../../utils/utils";

export default function ValidationList ({ profiles, onSelect }) {
  const [search, setSearch] = useState ("");

  const filteredProfiles = useMemo (() => {
    const term = search.trim ().toLowerCase ();

    if (!term) return profiles;

    return profiles.filter (profile => {
      const user = profile.user ?? {};
      const searchableText = [user.name, user.lastName, user.email, user.documentNumber].filter (Boolean).join (" ").toLowerCase ();

      return searchableText.includes (term);
    });
  }, [profiles, search]);

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-text">Solicitudes pendientes</h2>
        <p className="mt-1 text-sm text-text-secondary">Revisá los datos y la documentación de cada acompañante</p>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-text" htmlFor="searchAT">Buscar profesional</label>
        <div className="relative">
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" name="search"/>
          <input 
           className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" 
           id="searchAT" type="search" value={search} onChange={event => setSearch (event.target.value)} placeholder="Nombre, apellido, correo o documento"
          />
        </div>
      </div>
      {filteredProfiles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" name="check"/>
          </div>
          <h3 className="mt-4 font-semibold text-text">{search ? "No se encontraron coincidencias" : "No hay solicitudes pendientes"}</h3>
          <p className="mt-2 text-sm text-text-secondary">{search ? "Probá con otro nombre o dato de búsqueda" : "Las nuevas solicitudes aparecerán en esta sección"}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredProfiles.map (profile => {
            const user = profile.user ?? {};
            const documentCount = profile.documents?.length ?? 0;
            return (
              <article className="rounded-2xl border border-border bg-surface p-5 transition-colors sm:p-6" key={profile.id}>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon name="user" className="h-6 w-6"/>
                    </div>
                    <div className="min-w-0">
                      <h3 className="wrap-break-word font-bold text-text">{user.name} {user.lastName}</h3>
                      <p className="mt-1 break-all text-sm text-text-secondary">{user.email || "Correo no disponible"}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Pendiente</span>
                        <span className="rounded-full bg-background px-3 py-1 text-xs text-text-secondary">
                          {documentCount}{" "} {documentCount === 1 ? "documento" : "documentos"}
                        </span>
                      </div>
                      <p className="mt-3 text-xs text-text-muted">Registro: {formatDateList (user.createdAt)}</p>
                    </div>
                  </div>
                  <button
                   className="cursor-pointer inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm 
                    font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/40"
                   onClick={() => onSelect(profile)}
                  >
                    Revisar perfil
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}