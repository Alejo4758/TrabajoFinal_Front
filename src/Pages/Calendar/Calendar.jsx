import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import ATCalendar from "./ATCalendar";
import ClientCalendar from "./ClientCalendar";

// Elige la vista según el rol. La ruta ya está protegida; el backend vuelve a validar el rol en cada endpoint
export default function Calendar () {
  const { user } = useAuth ();

  if (user.role === ROLES.CLIENT) return <ClientCalendar userId={user.id}/>;

  return <ATCalendar userId={user.id}/>;
}
