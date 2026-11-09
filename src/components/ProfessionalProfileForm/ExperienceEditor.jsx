import { EXPERIENCE_DESCRIPTION_MAX, EXPERIENCE_TITLE_MAX, SELECT_CLASS } from "./formShared";

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const FIRST_YEAR = 1960;

const INPUT_CLASS = "w-full min-w-0 rounded-md border bg-surface px-3 py-2.5 text-sm text-text placeholder:text-text-muted outline-none transition focus:ring-2";

const inputClass = error => `${INPUT_CLASS} ${error ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-border focus:border-primary focus:ring-primary/20"}`;

// Mes y año con dos listas. No se usa <input type="month"> porque algunos navegadores lo muestran como un campo de texto común
function MonthYearField ({ id, legend, month, year, onChange, error, disabled }) {
    const currentYear = new Date ().getFullYear ();
    const years = Array.from ({ length: currentYear - FIRST_YEAR + 1 }, (_, index) => String (currentYear - index));

    return (
        <fieldset disabled={disabled} aria-describedby={error ? `${id}-error` : undefined} className="min-w-0 disabled:opacity-60">
            <legend className="mb-1.5 text-xs font-medium text-text-secondary">{legend}</legend>
            <div className="grid grid-cols-[3fr_2fr] gap-2">
                <select id={`${id}-month`} aria-label={`${legend}: mes`} value={month} onChange={event => onChange (event.target.value, year)} aria-invalid={Boolean (error)} className={`${SELECT_CLASS} ${error ? "border-red-600" : ""}`}>
                    <option value="">Mes</option>
                    {MONTHS.map ((name, index) => <option key={name} value={String (index + 1).padStart (2, "0")}>{name}</option>)}
                </select>
                <select id={`${id}-year`} aria-label={`${legend}: año`} value={year} onChange={event => onChange (month, event.target.value)} aria-invalid={Boolean (error)} className={`${SELECT_CLASS} ${error ? "border-red-600" : ""}`}>
                    <option value="">Año</option>
                    {years.map (item => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
        </fieldset>
    );
}

// Una experiencia laboral. experience = { key, title, startMonth, startYear, current, finishMonth, finishYear, description }.
// errors usa las claves "<key>.title", "<key>.start" y "<key>.finish"
export default function ExperienceEditor ({ experience, position, onChange, onRemove, errors }) {
    const set = patch => onChange ({ ...experience, ...patch });
    const id = `exp-${experience.key}`;
    const error = field => errors[`${experience.key}.${field}`];

    return (
        <li className="rounded-2xl border border-border bg-background p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-text">Experiencia {position}</h4>
                <button type="button" onClick={onRemove} className="cursor-pointer text-sm font-medium text-red-600 hover:underline focus:outline-none focus:underline">
                    Quitar
                </button>
            </div>

            <div className="mt-4 space-y-4">
                <div>
                    <label htmlFor={`${id}-title`} className="mb-1.5 block text-xs font-medium text-text-secondary">Puesto o lugar de trabajo</label>
                    <input id={`${id}-title`} type="text" value={experience.title} maxLength={EXPERIENCE_TITLE_MAX} onChange={event => set ({ title: event.target.value })}
                        placeholder="Ej.: Acompañamiento escolar en nivel primario" aria-invalid={Boolean (error ("title"))} aria-describedby={error ("title") ? `${id}-title-error` : undefined}
                        className={inputClass (error ("title"))}
                    />
                    {error ("title") && <p id={`${id}-title-error`} className="mt-1 text-sm text-red-600">{error ("title")}</p>}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <MonthYearField id={`${id}-start`} legend="Desde" month={experience.startMonth} year={experience.startYear} onChange={(startMonth, startYear) => set ({ startMonth, startYear })} error={error ("start")}/>
                    <MonthYearField id={`${id}-finish`} legend="Hasta" month={experience.current ? "" : experience.finishMonth} year={experience.current ? "" : experience.finishYear} onChange={(finishMonth, finishYear) => set ({ finishMonth, finishYear })} error={experience.current ? undefined : error ("finish")} disabled={experience.current}/>
                </div>

                <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-text">
                    <input type="checkbox" checked={experience.current} onChange={event => set ({ current: event.target.checked })} className="size-4 accent-primary"/>
                    Trabajo acá actualmente
                </label>

                <div>
                    <label htmlFor={`${id}-description`} className="mb-1.5 block text-xs font-medium text-text-secondary">Descripción (opcional)</label>
                    <textarea id={`${id}-description`} rows={3} value={experience.description} maxLength={EXPERIENCE_DESCRIPTION_MAX} onChange={event => set ({ description: event.target.value })}
                        placeholder="Qué tareas hacías, con qué población trabajabas..." className={`${inputClass (false)} resize-y`}
                    />
                </div>
            </div>
        </li>
    );
}
