export default function Field ({ id, label, children }) {
  return (
    <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-text-secondary">
            {label}
        </label>
        {children}
    </div>
  );
}