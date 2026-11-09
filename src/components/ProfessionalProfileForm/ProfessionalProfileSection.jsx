import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getMyProfessionalProfile } from "../../services/profileATService";
import { PROFILE_EDIT_PARAM } from "../../utils/constants";
import { availabilityByDay, formatDate, formatMonthYear } from "../../utils/utils";
import { InfoRow } from "../AT/InfoRow/InfoRow";
import Pill from "../AT/Pill/Pill";
import ProfessionalProfileForm from "./ProfessionalProfileForm";

const CARD = "rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8";

const BUTTON = "cursor-pointer rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30";

// Nombres de los ids elegidos, en el orden del catálogo
const namesOf = (ids, options) => options.filter (option => ids.includes (option.id)).map (option => option.name);

// pending = sugeridas que todavía no revisó un administrador
function TagList ({ items, pending = [], empty }) {
    if (items.length === 0 && pending.length === 0) return <p className="text-sm text-text-muted">{empty}</p>;
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map (item => <li key={item}><Pill>{item}</Pill></li>)}
            {pending.map (item => <li key={`pending-${item}`}><Pill tone="warning">{item} · Pendiente de revisión</Pill></li>)}
        </ul>
    );
}

function Block ({ title, children }) {
    return (
        <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">{title}</h3>
            {children}
        </div>
    );
}

// Perfil profesional del A.T. en "Mi perfil": lo muestra y, con ?editar=profesional en la dirección, abre el formulario para completarlo.
// El estado de edición va en la dirección para que el aviso de la barra (y "Completar ahora") lleven directo al formulario.
// profileAT es el de la sesión (id, fecha de nacimiento, estado); el resto se pide al backend porque la sesión no lo tiene
export default function ProfessionalProfileSection ({ profileAT }) {
    const { token, updateUser } = useAuth ();
    const [searchParams, setSearchParams] = useSearchParams ();

    const editing = searchParams.get (PROFILE_EDIT_PARAM.name) === PROFILE_EDIT_PARAM.value;

    const [state, setState] = useState ({ loading: true, error: "", data: null });
    const [reloadKey, setReloadKey] = useState (0);
    const [savedMessage, setSavedMessage] = useState ("");
    const sectionRef = useRef (null);

    useEffect (() => {
        let cancelled = false;

        getMyProfessionalProfile (token).then (result => {
            if (cancelled) return;
            setState (result.error || !result.data
                ? { loading: false, error: result.error || "No se pudo cargar tu perfil profesional", data: null }
                : { loading: false, error: "", data: result.data });
        });

        return () => {
            cancelled = true;
        };
    }, [token, reloadKey]);

    // Al abrir el formulario (también al llegar desde el aviso de la barra) se lo lleva a la vista
    useEffect (() => {
        if (editing) sectionRef.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    }, [editing]);

    const retry = () => {
        setState ({ loading: true, error: "", data: null });
        setReloadKey (key => key + 1);
    };

    const openEditor = () => {
        setSavedMessage ("");
        setSearchParams ({ [PROFILE_EDIT_PARAM.name]: PROFILE_EDIT_PARAM.value });
    };

    // replace: después de guardar o cancelar, "atrás" no vuelve a abrir el formulario
    const closeEditor = () => setSearchParams ({}, { replace: true });

    const handleSaved = saved => {
        setState (previous => ({ ...previous, data: { ...saved, options: previous.data.options } }));
        // La sesión se actualiza para que el aviso de la barra desaparezca (o diga qué falta) sin volver a iniciar sesión
        updateUser ({
            profileAT: { ...profileAT, genre: saved.genre || null, studies: saved.studies || null },
            isProfileIncomplete: saved.isProfileIncomplete,
            missingProfileFields: saved.missingProfileFields,
        });
        setSavedMessage (saved.isProfileIncomplete ? "Guardamos los cambios. Todavía te faltan algunos datos para completar el perfil" : "Tu perfil profesional está completo");
        closeEditor ();
    };

    const profile = state.data;

    // Cómo se resolvieron hace poco sus sugerencias: si ya estaba en la lista con otro nombre, si se agregó o por qué no se aprobó
    const reviewed = profile ? [
        ...[["Especialidad", profile.suggestions?.especialities], ["Obra social", profile.suggestions?.obrasSociales]].flatMap (([kind, group]) => [
            ...(group?.approved ?? []).map (item => ({ key: `a-${kind}-${item.name}`, kind, name: item.name, text: `${item.reviewNote || "Se aprobó"}. Quedó marcada en tu perfil.` })),
            ...(group?.rejected ?? []).map (item => ({ key: `r-${kind}-${item.name}`, kind, name: item.name, text: `No se aprobó${item.reviewNote ? `: ${item.reviewNote}` : "."}` })),
        ]),
    ] : [];

    return (
        <section ref={sectionRef} aria-labelledby="professional-profile-title" className={`${CARD} scroll-mt-24`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <h2 id="professional-profile-title" className="text-xl font-bold text-text">
                    {editing ? "Editar perfil profesional" : "Perfil profesional"}
                </h2>
                {!editing && (
                    <div className="flex flex-wrap items-center gap-4">
                        {/* El perfil público se busca por el id del perfil de AT, no por el id del usuario */}
                        <Link to={`/profileAT/at/${profileAT.id}`} className="text-sm font-semibold text-primary hover:underline">
                            Ver mi perfil público
                        </Link>
                        {profile && <button type="button" onClick={openEditor} className={BUTTON}>Editar</button>}
                    </div>
                )}
            </div>

            {savedMessage && !editing && (
                <div role="status" className="mb-6 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {savedMessage}
                </div>
            )}

            {state.loading && <p className="text-sm text-text-muted">Cargando tu perfil profesional...</p>}

            {!state.loading && state.error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                    <p>{state.error}</p>
                    <button type="button" onClick={retry} className="mt-3 cursor-pointer rounded-lg border border-red-200 px-3 py-2 font-semibold transition hover:bg-red-100">
                        Reintentar
                    </button>
                </div>
            )}

            {profile && editing && (
                <ProfessionalProfileForm profile={profile} options={profile.options} onSaved={handleSaved} onCancel={closeEditor}/>
            )}

            {profile && !editing && (
                <div className="space-y-6">
                    {reviewed.length > 0 && (
                        <section aria-labelledby="suggestions-news-title" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                            <h3 id="suggestions-news-title" className="font-semibold text-text">Novedades de tus sugerencias</h3>
                            <ul className="mt-2 space-y-1 text-text-secondary">
                                {reviewed.map (item => (
                                    <li key={item.key}>{item.kind} <span className="font-medium text-text">"{item.name}"</span>: {item.text}</li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <dl className="grid gap-5 sm:grid-cols-3">
                        {/* formatDate toma el día tal como está guardado: con formatDateDetail la zona horaria lo correría un día */}
                        <InfoRow label="Fecha de nacimiento">{profileAT.dateOfBirth && formatDate (profileAT.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })}</InfoRow>
                        <InfoRow label="Género">{profile.genre}</InfoRow>
                        <InfoRow label="Estudios">{profile.studies}</InfoRow>
                    </dl>

                    <Block title="Zonas de trabajo">
                        <TagList items={profile.localities.map (locality => `${locality.name} (${locality.provinceName})`)} empty="Sin zonas de trabajo cargadas"/>
                    </Block>

                    <Block title="Especialidades">
                        <TagList items={namesOf (profile.especialityIds, profile.options.especialities)} pending={profile.suggestions?.especialities?.pending ?? []} empty="Sin especialidades cargadas"/>
                    </Block>

                    <Block title="Obras sociales">
                        <TagList items={namesOf (profile.obraSocialIds, profile.options.obrasSociales)} pending={profile.suggestions?.obrasSociales?.pending ?? []} empty="Sin obras sociales cargadas"/>
                    </Block>

                    <Block title="Experiencia laboral">
                        {profile.experiences.length > 0 ? (
                            <ul className="space-y-3">
                                {profile.experiences.map (experience => (
                                    <li key={experience.id} className="rounded-xl border border-border bg-background p-4">
                                        <p className="font-semibold text-text">{experience.title}</p>
                                        <p className="mt-0.5 text-sm text-text-secondary">{formatMonthYear (experience.startDate)} - {formatMonthYear (experience.finishDate)}</p>
                                        {experience.description && <p className="mt-2 whitespace-pre-line wrap-break-word text-sm text-text-secondary">{experience.description}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-muted">Sin experiencias cargadas</p>
                        )}
                    </Block>

                    <Block title="Disponibilidad horaria">
                        {availabilityByDay (profile.availability).length > 0 ? (
                            <dl className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
                                {availabilityByDay (profile.availability).map (({ dayOfWeek, day, ranges }) => (
                                    <div key={dayOfWeek} className="contents">
                                        <dt className="font-medium text-text">{day}</dt>
                                        <dd className="mb-1 text-text-secondary sm:mb-0">{ranges.map (range => `${range.startTime} a ${range.endTime}`).join (", ")}</dd>
                                    </div>
                                ))}
                            </dl>
                        ) : (
                            <p className="text-sm text-text-muted">Sin horarios cargados: en tu perfil público se muestra "A convenir"</p>
                        )}
                    </Block>
                </div>
            )}
        </section>
    );
}
