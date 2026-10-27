import { ICONS } from "../../utils/constants";

export default function Icon({
  name,
  className = "h-5 w-5",
}) {
  const path = ICONS[name];

  if (!path) {
    console.warn(`El icono "${name}" no está definido en ICONS.`);
    return null;
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}