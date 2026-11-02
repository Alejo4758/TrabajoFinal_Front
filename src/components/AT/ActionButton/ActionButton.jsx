export function ActionButton ({ children, variant = 'primary' }) {
  return (
    <button type="button" disabled className={`cursor-not-allowed rounded-xl px-4 py-2.5 text-sm font-semibold opacity-60 ${variant === 'primary' ? 'bg-primary text-white' : 'border border-border text-text'}`}>
        {children}
    </button>
  );
}