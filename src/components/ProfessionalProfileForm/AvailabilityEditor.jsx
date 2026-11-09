import { DAYS_OF_WEEK } from "../../utils/constants";
import { WEEK_ORDER } from "../../utils/utils";
import { RANGES_PER_DAY_MAX, SELECT_CLASS } from "./formShared";

// Lunes a viernes
const WEEKDAYS = [1, 2, 3, 4, 5];

// Horario que se propone al agregar la primera, segunda y tercera franja de un día
const DEFAULT_RANGES = [["09:00", "13:00"], ["14:00", "18:00"], ["19:00", "21:00"]];

const newKey = () => globalThis.crypto?.randomUUID?.() ?? `r${Date.now ().toString (36)}${Math.random ().toString (36).slice (2, 6)}`;

const SMALL_BUTTON = "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30";

// Disponibilidad horaria del A.T., de lunes a domingo. value = [{ key, dayOfWeek, startTime: "HH:MM", endTime: "HH:MM" }]
// (dayOfWeek: 0 = domingo ... 6 = sábado). errors usa la clave "avail:<key>" de cada franja
export default function AvailabilityEditor ({ value, onChange, errors }) {
    const rangesOf = dayOfWeek => value.filter (range => range.dayOfWeek === dayOfWeek);

    const addRange = dayOfWeek => {
        const [startTime, endTime] = DEFAULT_RANGES[rangesOf (dayOfWeek).length] ?? ["", ""];
        onChange ([...value, { key: newKey (), dayOfWeek, startTime, endTime }]);
    };

    const updateRange = (key, patch) => onChange (value.map (range => (range.key === key ? { ...range, ...patch } : range)));

    const removeRange = key => onChange (value.filter (range => range.key !== key));

    // Copia los horarios de un día a todos los días hábiles (reemplaza los que tenían)
    const copyToWeekdays = dayOfWeek => {
        const source = rangesOf (dayOfWeek);
        const others = value.filter (range => !WEEKDAYS.includes (range.dayOfWeek) || range.dayOfWeek === dayOfWeek);
        const copies = WEEKDAYS.filter (day => day !== dayOfWeek).flatMap (day => source.map (range => ({ ...range, key: newKey (), dayOfWeek: day })));
        onChange ([...others, ...copies]);
    };

    return (
        <ul className="divide-y divide-border rounded-xl border border-border">
            {WEEK_ORDER.map (dayOfWeek => {
                const ranges = rangesOf (dayOfWeek);
                const day = DAYS_OF_WEEK[dayOfWeek];

                return (
                    <li key={dayOfWeek} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                        <h4 className="w-28 shrink-0 pt-2 text-sm font-semibold text-text">{day}</h4>

                        <div className="min-w-0 flex-1 space-y-2">
                            {ranges.length === 0 && <p className="pt-2 text-sm text-text-muted">No disponible</p>}

                            {ranges.map ((range, index) => {
                                const error = errors[`avail:${range.key}`];
                                const id = `avail-${range.key}`;
                                return (
                                    <div key={range.key}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <label htmlFor={`${id}-start`} className="sr-only">{day}, franja {index + 1}: desde</label>
                                            <input id={`${id}-start`} type="time" value={range.startTime} onChange={event => updateRange (range.key, { startTime: event.target.value })}
                                                aria-invalid={Boolean (error)} aria-describedby={error ? `${id}-error` : undefined} className={`${SELECT_CLASS} w-32 ${error ? "border-red-600" : ""}`}
                                            />
                                            <span className="text-sm text-text-secondary">a</span>
                                            <label htmlFor={`${id}-end`} className="sr-only">{day}, franja {index + 1}: hasta</label>
                                            <input id={`${id}-end`} type="time" value={range.endTime} onChange={event => updateRange (range.key, { endTime: event.target.value })}
                                                aria-invalid={Boolean (error)} aria-describedby={error ? `${id}-error` : undefined} className={`${SELECT_CLASS} w-32 ${error ? "border-red-600" : ""}`}
                                            />
                                            <button type="button" onClick={() => removeRange (range.key)} aria-label={`Quitar el horario ${index + 1} del ${day.toLowerCase ()}`} className="grid size-9 cursor-pointer place-items-center rounded-lg text-text-secondary transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                <span aria-hidden="true">×</span>
                                            </button>
                                        </div>
                                        {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-600">{error}</p>}
                                    </div>
                                );
                            })}

                            <div className="flex flex-wrap gap-1">
                                {ranges.length < RANGES_PER_DAY_MAX && (
                                    <button type="button" onClick={() => addRange (dayOfWeek)} className={SMALL_BUTTON}>
                                        + {ranges.length === 0 ? "Agregar horario" : "Agregar otra franja"}
                                    </button>
                                )}
                                {ranges.length > 0 && WEEKDAYS.includes (dayOfWeek) && (
                                    <button type="button" onClick={() => copyToWeekdays (dayOfWeek)} className={`${SMALL_BUTTON} text-text-secondary`}>
                                        Copiar a lunes a viernes
                                    </button>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
