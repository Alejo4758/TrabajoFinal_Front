export default function FormField ({ label, type = "text", as = "input", value, onChange, onBlur, error, hint, placeholder = "", required = true, id, name, autoComplete, rows = 4, maxLength, icon, rightSlot, children }) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const controlProps = { id, name, value, onChange, onBlur, required, className: `w-full min-w-0 rounded-md border bg-surface py-3 text-sm text-text placeholder:text-text-muted outline-none transition focus:ring-2 ${icon ? "pl-11" : "pl-4"} ${rightSlot ? "pr-24" : "pr-4"} ${as === "textarea" ? "resize-none" : ""} ${ error ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-border focus:border-primary focus:ring-primary/20"}` };

  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative w-full min-w-0">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-muted">
            {icon}
          </span>
        )}
        {as === "select" ? (
          <select {...controlProps}>
            {children}
          </select>
        ) : as === "textarea" ? (
          <textarea {...controlProps} rows={rows} maxLength={maxLength} placeholder={placeholder}/>
        ) : (
          <input {...controlProps} type={type} maxLength={maxLength} placeholder={placeholder} autoComplete={autoComplete}/>
        )}
        {rightSlot && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {rightSlot}
          </div>
        )}
      </div>
      {error ? (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p className="mt-1 text-xs text-text-secondary">
            {hint}
          </p>
        )
      )}
    </div>
  );
}