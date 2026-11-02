import { PILL_TONES } from "../../../utils/constants";

export default function Pill ({ children, tone = 'primary' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_TONES[tone]}`}>{children}</span>;
}