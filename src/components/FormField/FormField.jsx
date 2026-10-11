export default function FormField({ label, type = "text", value, onChange, error, placeholder = "", required = true, id, name, }) {
  return (
    <>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-text">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        id={id}
        name={name}
        className={`w-full rounded-md border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none transition focus:ring-2 ${
          error
            ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
            : "border-border focus:border-primary focus:ring-primary/20"
        }`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </>
  );
}