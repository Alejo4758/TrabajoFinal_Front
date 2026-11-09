import { DAYS_OF_WEEK } from "../../utils/constants";
import { WEEK_ORDER, formatAvailability, formatTimeRange, groupAvailability } from "../../utils/utils";

// Disponibilidad horaria de un A.T. como la ven las familias: los días con el mismo horario van juntos ("Lunes a viernes"),
// un renglón por grupo. compact = sin la tira de días (para las tarjetas del buscador)
export default function AvailabilitySummary ({ availability = [], compact = false }) {
    const groups = groupAvailability (availability);

    if (groups.length === 0) return <p className="text-sm text-text-secondary">A convenir</p>;

    const available = new Set (groups.flatMap (group => group.days));

    return (
        <div>
            {/* La tira es solo visual: la información completa está en la lista de abajo */}
            {!compact && (
                <ul aria-hidden="true" className="mb-3 flex gap-1.5">
                    {WEEK_ORDER.map (dayOfWeek => (
                        <li key={dayOfWeek} title={DAYS_OF_WEEK[dayOfWeek]}
                            className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${available.has (dayOfWeek) ? "bg-primary text-white" : "bg-surface-alt text-text-muted"}`}
                        >
                            {DAYS_OF_WEEK[dayOfWeek][0]}
                        </li>
                    ))}
                </ul>
            )}
            <dl aria-label={`Disponibilidad: ${formatAvailability (availability)}`} className="space-y-1.5 text-sm">
                {groups.map (group => (
                    <div key={group.label} className="flex items-baseline justify-between gap-3">
                        <dt className="font-medium text-text">{group.label}</dt>
                        <dd className="shrink-0 text-right text-text-secondary">
                            {group.ranges.map (range => <span key={range.startTime} className="block">{formatTimeRange (range)}</span>)}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
