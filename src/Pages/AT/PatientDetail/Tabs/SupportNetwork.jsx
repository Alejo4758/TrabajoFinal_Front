import { CardPatientDetail } from "../../../../components/AT/CardPatientDetail/CardPatientDetail";
import { ActionButton } from "../../../../components/AT/ActionButton/ActionButton";
import { GROUPS } from "../../../../utils/constants";
import EmptyState from "../../../../components/AT/EmptyState/EmptyState";
import Member from "../../../../components/AT/Member/Member";

export default function SupportNetwork ({ patient }) {
    const network = patient.supportNetwork;

    if (network.length === 0) {
        return (
            <EmptyState title={"La red de apoyo está vacía"} text={"Podés invitar a familiares y profesionales vinculados a la persona acompañada para que participen del acompañamiento"}>
                <ActionButton>
                    Invitar a la red de apoyo
                </ActionButton>
            </EmptyState>
        );
    }

    return (
        <div className="space-y-6">
            <CardPatientDetail title={"Red de apoyo"} subtitle={"Personas y profesionales que participan del acompañamiento"} action={<ActionButton>Invitar</ActionButton>}>
                <div className="space-y-8">
                    {GROUPS.map (group => {
                        const members = network.filter (m => m.group === group.id);
                        if (members.length === 0) return null;
                        return (
                            <section key={group.id}>
                                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    {group.title}
                                </h4>
                                <ul>
                                    {members.map (member => (
                                        <Member key={member.id} member={member}/>
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </CardPatientDetail>
        </div>
    );
}