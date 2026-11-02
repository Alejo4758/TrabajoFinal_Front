export function InfoRow ({ label, children }) {
  return (
    <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            {label}
        </dt>
        <dd className="mt-1 text-sm text-text">
            {children || '—'}
        </dd>
    </div>
  );
}