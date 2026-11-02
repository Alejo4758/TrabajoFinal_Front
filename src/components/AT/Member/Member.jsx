import { initials } from "../../../utils/utils";
import Pill from "../Pill/Pill";

export default function Member ({ member }) {
    const pending = member.status !== 'Activo';

    return (
        <li className="flex gap-4 rounded-xl border border-border bg-surface p-4 m-5">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-light font-semibold text-primary">
                {initials (member.name)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h3 className="font-semibold">
                        {member.name}
                    </h3>
                    {pending && <Pill tone="warning">{member.status}</Pill>}
                </div>
            <p className="text-sm text-text-muted">
                {member.role}
            </p>
            {member.notes && <p className="mt-2 text-sm text-text-secondary">{member.notes}</p>}
            <div className="mt-3 flex flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5">
                {member.phone && (
                    <p href={`tel:${member.phone.replace (/\s|-/g, '')}`} className="text-primary">
                        {member.phone}
                    </p>
                )}
                {member.email && (
                    <a href={`mailto:${member.email}`} className="break-all text-primary">
                        {member.email}
                    </a>
                )}
            </div>
      </div>
    </li>
  );
}