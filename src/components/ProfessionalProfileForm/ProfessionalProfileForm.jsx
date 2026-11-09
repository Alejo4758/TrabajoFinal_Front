import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useUnsavedChangesGuard } from "../../hooks/useUnsavedChangesGuard";
import { updateMyProfessionalProfile } from "../../services/profileATService";
import { matchesSearch } from "../../utils/catalogMatch";
import { EXPERIENCES_MAX, LOCALITIES_MAX, RANGES_PER_DAY_MAX, SELECT_CLASS, STUDIES_MAX } from "./formShared";
import LocalityPicker from "./LocalityPicker";
import ExperienceEditor from "./ExperienceEditor";
import SuggestionField from "./SuggestionField";
import AvailabilityEditor from "./AvailabilityEditor";

const newKey = () => globalThis.crypto?.randomUUID?.() ?? `n${Date.now ().toString (36)}${Math.random ().toString (36).slice (2, 6)}`;

// Mes actual "AAAA-MM" (hora local). El backend usa UTC, que en Argentina nunca está en un mes anterior: si acá se acepta, allá también
const currentMonth = () => {
    const now = new Date ();
    return `${now.getFullYear ()}-${String (now.getMonth () + 1).padStart (2, "0")}`;
};

const monthOf = (year, month) => (year && month ? `${year}-${month}` : "");

const emptyExperience = () => ({ key: newKey (), title: "", startMonth: "", startYear: "", current: false, finishMonth: "", finishYear: "", description: "" });

// Perfil que devuelve el backend -> estado del formulario. Las fechas "AAAA-MM" se separan en mes y año para las listas
const toForm = profile => ({
    genre: profile.genre ?? "",
    studies: profile.studies ?? "",
    localities: profile.localities ?? [],
    especialityIds: profile.especialityIds ?? [],
    obraSocialIds: profile.obraSocialIds ?? [],
    // Las que no están en la lista y esperan revisión de un administrador
    suggestedEspecialities: profile.suggestions?.especialities?.pending ?? [],
    suggestedObrasSociales: profile.suggestions?.obrasSociales?.pending ?? [],
    experiences: (profile.experiences ?? []).map (experience => ({
        key: String (experience.id),
        title: experience.title,
        startYear: experience.startDate?.slice (0, 4) ?? "",
        startMonth: experience.startDate?.slice (5, 7) ?? "",
        current: !experience.finishDate,
        finishYear: experience.finishDate?.slice (0, 4) ?? "",
        finishMonth: experience.finishDate?.slice (5, 7) ?? "",
        description: experience.description ?? "",
    })),
    // Cada franja lleva una clave para React y para sus errores. El orden es el que guardó el backend (por día y hora)
    availability: (profile.availability ?? []).map ((range, index) => ({ key: `a${index}`, ...range })),
});

const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Las mismas reglas que valida el backend para la disponibilidad: cada franja con inicio y fin, el fin después del inicio
// y sin superponerse con otra del mismo día. El error de superposición se marca en la franja que empieza después
const validateAvailability = (availability, errors) => {
    availability.forEach (range => {
        if (!range.startTime || !range.endTime) errors[`avail:${range.key}`] = "Completá la hora de inicio y la de fin";
        else if (range.endTime <= range.startTime) errors[`avail:${range.key}`] = "La hora de fin tiene que ser posterior a la de inicio";
    });

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const ranges = availability
            .filter (range => range.dayOfWeek === dayOfWeek && !errors[`avail:${range.key}`])
            .sort ((a, b) => a.startTime.localeCompare (b.startTime));
        ranges.forEach ((range, index) => {
            const previous = ranges[index - 1];
            if (previous && range.startTime < previous.endTime) {
                errors[`avail:${range.key}`] = `Se superpone con el horario de ${previous.startTime} a ${previous.endTime} del ${DAY_NAMES[dayOfWeek]}`;
            }
        });
    }
};

// Las mismas reglas que valida el backend para cada experiencia y la disponibilidad. El resto del perfil se puede guardar incompleto
const validate = form => {
    const errors = {};
    const now = currentMonth ();

    form.experiences.forEach (experience => {
        const key = experience.key;
        const start = monthOf (experience.startYear, experience.startMonth);
        const finish = monthOf (experience.finishYear, experience.finishMonth);

        if (!experience.title.trim ()) errors[`${key}.title`] = "Indicá el puesto o el lugar de trabajo";

        if (!start) errors[`${key}.start`] = "Elegí el mes y el año de inicio";
        else if (start > now) errors[`${key}.start`] = "No puede ser posterior al mes actual";

        if (!experience.current) {
            if (!finish) errors[`${key}.finish`] = "Elegí el mes y el año de fin, o marcá que trabajás acá actualmente";
            else if (finish > now) errors[`${key}.finish`] = "No puede ser posterior al mes actual. Si seguís trabajando acá, marcalo abajo";
            else if (start && finish < start) errors[`${key}.finish`] = "No puede ser anterior a la fecha de inicio";
        }
    });

    // Después de las experiencias, porque es la última sección: el foco va al primer error en el orden en que se ven
    validateAvailability (form.availability, errors);

    return errors;
};

// Dónde poner el foco para cada error
const focusTargetFor = errorKey => {
    if (errorKey.startsWith ("avail:")) return `avail-${errorKey.slice ("avail:".length)}-start`;
    const [key, field] = errorKey.split (".");
    if (field === "title") return `exp-${key}-title`;
    return `exp-${key}-${field}-month`;
};

const toPayload = form => ({
    genre: form.genre,
    studies: form.studies.trim (),
    localityIds: form.localities.map (locality => locality.id),
    especialityIds: form.especialityIds,
    obraSocialIds: form.obraSocialIds,
    suggestedEspecialities: form.suggestedEspecialities,
    suggestedObrasSociales: form.suggestedObrasSociales,
    experiences: form.experiences.map (experience => ({
        title: experience.title.trim (),
        startDate: monthOf (experience.startYear, experience.startMonth),
        finishDate: experience.current ? null : monthOf (experience.finishYear, experience.finishMonth),
        description: experience.description.trim (),
    })),
    availability: form.availability.map (({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
});

function Section ({ title, hint, required, children }) {
    return (
        <section className="space-y-3 border-t border-border pt-6 first:border-t-0 first:pt-0">
            <div>
                <h3 className="text-base font-bold text-text">
                    {title}
                    {required && <span className="ml-2 align-middle text-xs font-medium text-text-muted">Necesario para completar el perfil</span>}
                </h3>
                {hint && <p className="mt-1 text-sm text-text-muted">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

// Desde cuántas opciones se muestra el buscador de la lista
const SEARCH_FROM = 8;

// Casillas para elegir varias opciones de un catálogo. options = [{ id, name }], value = ids elegidos.
// Con muchas opciones aparece un buscador (sin importar mayúsculas, tildes ni espacios: "federadasalud" encuentra "Federada Salud")
function CheckboxGroup ({ id, legend, options, value, onChange }) {
    const [search, setSearch] = useState ("");

    const toggle = optionId => onChange (value.includes (optionId) ? value.filter (item => item !== optionId) : [...value, optionId]);

    if (options.length === 0) return <p className="text-sm text-text-muted">No hay opciones cargadas.</p>;

    const visible = search.trim () ? options.filter (option => matchesSearch (option.name, search)) : options;

    return (
        <fieldset className="space-y-3">
            <legend className="sr-only">{legend}</legend>
            {options.length > SEARCH_FROM && (
                <div>
                    <label htmlFor={`${id}-search`} className="mb-1.5 block text-xs font-medium text-text-secondary">Buscar en la lista ({options.length} opciones, {value.length} marcadas)</label>
                    <input id={`${id}-search`} type="search" value={search} onChange={event => setSearch (event.target.value)} placeholder="Escribí para filtrar" className={SELECT_CLASS}/>
                </div>
            )}
            {visible.length === 0 && <p className="text-sm text-text-muted">No hay ninguna con ese nombre. Si no está, sugerila abajo.</p>}
            <div className="grid gap-2 sm:grid-cols-2">
                {visible.map (option => {
                    const on = value.includes (option.id);
                    return (
                        <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${on ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                            <input type="checkbox" checked={on} onChange={() => toggle (option.id)} className="size-4 shrink-0 accent-primary"/>
                            {option.name}
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

// Formulario del perfil profesional del A.T.: lo que el registro no pide. profile y options son lo que devuelve GET /at/me/profile.
// Se puede guardar incompleto; onSaved recibe el perfil guardado, que dice qué falta todavía (missingProfileFields)
export default function ProfessionalProfileForm ({ profile, options, onSaved, onCancel }) {
    const { token } = useAuth ();

    const [form, setForm] = useState (() => toForm (profile));
    const [initialSnapshot] = useState (() => JSON.stringify (toForm (profile)));
    const [errors, setErrors] = useState ({});
    const [saving, setSaving] = useState (false);
    const [serverError, setServerError] = useState ("");

    const dirty = JSON.stringify (form) !== initialSnapshot;

    // Avisa antes de recargar, cerrar la pestaña o ir a otra página con cambios sin guardar
    useUnsavedChangesGuard (dirty && !saving);

    // Un género guardado antes de que existiera la lista igual se muestra, para no perderlo al guardar
    const genres = form.genre && !options.genres.includes (form.genre) ? [form.genre, ...options.genres] : options.genres;

    const update = patch => {
        const next = { ...form, ...patch };
        setForm (next);
        setServerError ("");
        if (Object.keys (errors).length > 0) setErrors (validate (next));
    };

    const updateExperience = experience => update ({ experiences: form.experiences.map (item => (item.key === experience.key ? experience : item)) });

    const removeExperience = key => update ({ experiences: form.experiences.filter (item => item.key !== key) });

    const addExperience = () => update ({ experiences: [...form.experiences, emptyExperience ()] });

    const handleCancel = () => {
        if (dirty && !window.confirm ("Hay cambios sin guardar. Si salís ahora, se pierden. ¿Querés salir igual?")) return;
        onCancel ();
    };

    const handleSubmit = async event => {
        event.preventDefault ();

        const found = validate (form);
        setErrors (found);

        const firstError = Object.keys (found)[0];
        if (firstError) {
            document.getElementById (focusTargetFor (firstError))?.focus ();
            return;
        }

        setSaving (true);
        setServerError ("");

        const result = await updateMyProfessionalProfile (toPayload (form), token);

        setSaving (false);

        if (result.error || !result.data) {
            setServerError (result.error || "No se pudo guardar el perfil. Intentá nuevamente");
            return;
        }

        onSaved (result.data);
    };

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <Section title="Datos generales">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="profile-genre" className="mb-1.5 block text-xs font-medium text-text-secondary">Género</label>
                        <select id="profile-genre" value={form.genre} onChange={event => update ({ genre: event.target.value })} className={SELECT_CLASS}>
                            <option value="">Sin indicar</option>
                            {genres.map (genre => <option key={genre} value={genre}>{genre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="profile-studies" className="mb-1.5 block text-xs font-medium text-text-secondary">Estudios</label>
                        <input id="profile-studies" type="text" value={form.studies} maxLength={STUDIES_MAX} onChange={event => update ({ studies: event.target.value })}
                            placeholder="Ej.: Tecnicatura Superior en Acompañamiento Terapéutico" className={SELECT_CLASS}
                        />
                    </div>
                </div>
                <p className="text-xs text-text-muted">El género y los estudios son necesarios para completar el perfil.</p>
            </Section>

            <Section title="Zonas de trabajo" hint="Las localidades donde podés hacer acompañamientos. Las familias buscan por zona." required>
                <LocalityPicker value={form.localities} onChange={localities => update ({ localities })} max={LOCALITIES_MAX}/>
            </Section>

            <Section title="Especialidades" hint="Opcional. Ayuda a que te encuentren las familias que buscan una especialidad.">
                <CheckboxGroup id="especialities" legend="Especialidades" options={options.especialities} value={form.especialityIds} onChange={especialityIds => update ({ especialityIds })}/>
                <SuggestionField id="suggest-especiality" kind="Especialidades" options={options.especialities} selected={form.especialityIds}
                    value={form.suggestedEspecialities} onChange={suggestedEspecialities => update ({ suggestedEspecialities })}
                    onPick={id => update ({ especialityIds: form.especialityIds.includes (id) ? form.especialityIds : [...form.especialityIds, id] })}
                    approved={profile.suggestions?.especialities?.approved} rejected={profile.suggestions?.especialities?.rejected}
                />
            </Section>

            <Section title="Obras sociales" hint="Las obras sociales y programas con los que trabajás. Si sugerís una, mientras se revisa cuenta como cargada." required>
                <CheckboxGroup id="obras-sociales" legend="Obras sociales" options={options.obrasSociales} value={form.obraSocialIds} onChange={obraSocialIds => update ({ obraSocialIds })}/>
                <SuggestionField id="suggest-obra-social" kind="Obras sociales" options={options.obrasSociales} selected={form.obraSocialIds}
                    value={form.suggestedObrasSociales} onChange={suggestedObrasSociales => update ({ suggestedObrasSociales })}
                    onPick={id => update ({ obraSocialIds: form.obraSocialIds.includes (id) ? form.obraSocialIds : [...form.obraSocialIds, id] })}
                    approved={profile.suggestions?.obrasSociales?.approved} rejected={profile.suggestions?.obrasSociales?.rejected}
                />
            </Section>

            <Section title="Experiencia laboral" required>
                {form.experiences.length > 0 ? (
                    <ul className="space-y-4">
                        {form.experiences.map ((experience, index) => (
                            <ExperienceEditor key={experience.key} experience={experience} position={index + 1} errors={errors} onChange={updateExperience} onRemove={() => removeExperience (experience.key)}/>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-text-muted">Todavía no agregaste experiencias.</p>
                )}
                {form.experiences.length < EXPERIENCES_MAX && (
                    <button type="button" onClick={addExperience} className="w-full cursor-pointer rounded-xl border-2 border-dashed border-border py-3 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/30">
                        + Agregar experiencia
                    </button>
                )}
            </Section>

            <Section title="Disponibilidad horaria" hint={`Se muestra en tu perfil público y en el buscador. Podés cargar hasta ${RANGES_PER_DAY_MAX} franjas por día. Si no cargás ninguna, se muestra "A convenir".`}>
                <AvailabilityEditor value={form.availability} onChange={availability => update ({ availability })} errors={errors}/>
            </Section>

            {Object.keys (errors).length > 0 && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    Revisá los campos marcados en rojo para guardar
                </div>
            )}
            {serverError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{serverError}</div>}

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleCancel} disabled={saving} className="cursor-pointer rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60">
                    Cancelar
                </button>
                <button type="submit" disabled={saving} className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Guardando..." : "Guardar perfil profesional"}
                </button>
            </div>
        </form>
    );
}
