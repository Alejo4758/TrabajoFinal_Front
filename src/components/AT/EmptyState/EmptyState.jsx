export default function EmptyState ({ title, text, children }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center sm:p-12">
        <p className="font-semibold">
            {title}
        </p>
        {text && <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{text}</p>}
        {children && <div className="mt-5">{children}</div>}
    </div>
  );
}