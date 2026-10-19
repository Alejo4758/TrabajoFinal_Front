export default function FormField ({ label, type = "text", value, onChange, onBlur, error, placeholder = "", required = true, id, name, icon, rightSlot }) {
  return (
    <>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-text-muted">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          id={id}
          name={name}
          className={`w-full rounded-md border bg-surface py-3 text-sm text-text placeholder:text-text-muted outline-none transition focus:ring-2 ${
            icon ? "pl-11" : "pl-4"
          } ${rightSlot ? "pr-24" : "pr-4"} ${
            error
              ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
              : "border-border focus:border-primary focus:ring-primary/20"
          }`}
        />
        {rightSlot && <div className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</div>}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}