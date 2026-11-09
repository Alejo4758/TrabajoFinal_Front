
import { SCALE_LEVELS, levelInfo } from "../../../utils/scale";

export default function RatingInput({
  name,
  legend,
  value,
  onChange,
  error,
}) {
  const selected = levelInfo(value);
  const first = SCALE_LEVELS[0];
  const last = SCALE_LEVELS[SCALE_LEVELS.length - 1];

  return (
    <fieldset
      aria-describedby={`${name}-help`}
      className="min-w-0"
    >
      <legend className="sr-only">{legend}</legend>

      <div className="flex gap-2">
        {SCALE_LEVELS.map((level) => (
          <div key={level.value} className="min-w-0 flex-1">
            <input
              type="radio"
              id={`${name}-${level.value}`}
              name={name}
              value={level.value}
              checked={Number(value) === level.value}
              onChange={() => onChange(level.value)}
              className="peer sr-only"
            />

            <label
              htmlFor={`${name}-${level.value}`}
              className={`flex h-12 cursor-pointer items-center justify-center rounded-lg border bg-surface text-lg font-semibold transition hover:border-primary/60 peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 ${
                error
                  ? "border-red-600 text-text-secondary"
                  : "border-border text-text-secondary"
              }`}
            >
              {level.value}
              <span className="sr-only"> — {level.label}</span>
            </label>
          </div>
        ))}
      </div>

      <div
        className="mt-1.5 flex justify-between gap-2 text-[11px] text-text-muted"
        aria-hidden="true"
      >
        <span>1 · {first.label}</span>
        <span>5 · {last.label}</span>
      </div>

      <p
        id={`${name}-help`}
        aria-live="polite"
        className={`mt-2 min-h-5 text-sm ${
          error ? "text-red-600" : "text-text-secondary"
        }`}
      >
        {error ? (
          error
        ) : selected ? (
          <>
            <strong className="font-semibold text-text">
              {selected.label}.
            </strong>{" "}
            {selected.description}
          </>
        ) : (
          "Elegí el nivel que observaste en este encuentro."
        )}
      </p>
    </fieldset>
  );
}
