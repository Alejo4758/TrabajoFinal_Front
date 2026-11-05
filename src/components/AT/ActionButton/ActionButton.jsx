export default function ActionButton ({ children, variant = "primary", type = "button", ...props }) {
  return (
    <button type={type} {...props}
      className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${variant === "primary" ? "bg-primary text-white hover:bg-primary-hover" : "border border-border text-text hover:bg-surface-alt"}`}>
      {children}
    </button>
  );
}