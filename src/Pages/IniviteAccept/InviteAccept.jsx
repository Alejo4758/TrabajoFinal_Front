import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import FormField from "../../components/FormField/FormField";
import Icon from "../../components/Icon/Icon";
import { useAuth } from "../../hooks/useAuth";
import { NETWORK_ROLES, accessLabels, roleInfo, validateAccept } from "../../utils/networkModel";
import { acceptInvitation, getInvitation } from "../../services/networkService";

const LOGIN_BUTTON = "mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover";

// La página de login es solo para visitantes: con otra sesión abierta en el navegador (por ejemplo la del AT que
// mandó la invitación) redirige a esa cuenta. Por eso, si hay una sesión, primero se cierra
function LoginButton () {
    const { user, isAuthenticated, logout } = useAuth ();
    const navigate = useNavigate ();

    if (!isAuthenticated) return <Link to="/login" className={LOGIN_BUTTON}>Iniciar sesión</Link>;

    return (
        <>
            <p className="m-0 mt-4 text-sm text-text-muted">En este navegador está abierta la sesión de {user?.email || "otra cuenta"}.</p>
            <button type="button" onClick={() => { logout (); navigate ("/login"); }} className={`cursor-pointer ${LOGIN_BUTTON}`}>
                Cerrar esa sesión e iniciar sesión
            </button>
        </>
    );
}

/* Logo: tres nodos conectados */
function BrandMark ({ className = "h-11 w-11" }) {
    return (
        <div className={`flex ${className} items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M12 6 6.5 17M12 6l5.5 11M6.5 17h11" opacity=".7" />
                <circle cx="12" cy="6" r="2.4" fill="currentColor" />
                <circle cx="6.5" cy="17" r="2.4" fill="currentColor" />
                <circle cx="17.5" cy="17" r="2.4" fill="currentColor" />
            </svg>
        </div>
    )
}

// text puede depender del error: el backend manda details.atName con la invitación vencida
const ERROR_COPY = {
    not_found: { title: "Este enlace no es válido", text: () => "Revisá que el enlace esté completo o pedí que te envíen una invitación nueva.", login: false },
    expired: { title: "La invitación venció", text: ({ details }) => `Las invitaciones duran 7 días. Pedile a ${details?.atName || "quien te invitó"} que te envíe una nueva.`, login: false },
    used: { title: "Esta invitación ya fue utilizada", text: () => "Si ya creaste tu cuenta, iniciá sesión para continuar.", login: true },
    email_taken: { title: "Ya existe una cuenta con este correo", text: () => "Iniciá sesión con esa cuenta. Si no recordás la contraseña, pedile ayuda a quien te invitó.", login: true },
    // Sin conexión, demasiados pedidos o un error del servidor: no dice nada sobre el enlace
    unavailable: { title: "No pudimos verificar tu invitación", text: ({ message }) => message || "Intentá nuevamente en unos minutos.", login: false },
};

const errorState = err => ({ status: "error", code: err.code in ERROR_COPY ? err.code : "unavailable", message: err.message, details: err.details });

const EMPTY_FORM = { name: "", lastName: "", password: "", confirmPassword: "", role: "", relationship: "", consent: false };

export default function InviteAccept () {
    const { token } = useParams ();

    const [state, setState] = useState ({ status: "loading" }); // loading | error | ready | done
    const [invitation, setInvitation] = useState (null);
    const [form, setForm] = useState (EMPTY_FORM);
    const [errors, setErrors] = useState ({});
    const [serverError, setServerError] = useState ("");
    const [sending, setSending] = useState (false);
    const [showPassword, setShowPassword] = useState (false);

    useEffect (() => {
        let cancelled = false;
        const load = async () => {
            setState ({ status: "loading" });
            try {
                const data = await getInvitation (token);
                if (cancelled) return;
                const [firstName = "", ...rest] = (data.name || "").trim ().split (/\s+/);
                setInvitation (data);
                // El AT pudo cargar nombre y rol: se sugieren, y la persona los confirma o corrige
                setForm ({ ...EMPTY_FORM, name: firstName, lastName: rest.join (" "), role: data.role, relationship: data.relationship || "" });
                setState ({ status: "ready" });
            } catch (err) {
                if (!cancelled) setState (errorState (err));
            }
        };
        load ();
        return () => { cancelled = true; };
    }, [token]);

    const handleChange = event => {
        const { name, value, type, checked } = event.target;
        setForm (prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
        setErrors (prev => ({ ...prev, [name]: "" }));
        setServerError ("");
    };

    const handleSubmit = async event => {
        event.preventDefault ();
        const found = validateAccept (form);
        setErrors (found);
        const first = Object.keys (found)[0];
        if (first) {
            document.getElementById (first)?.focus ();
            return;
        }

        setSending (true);
        setServerError ("");
        try {
            await acceptInvitation (token, { name: form.name.trim (), lastName: form.lastName.trim (), password: form.password, role: form.role, relationship: form.relationship.trim () });
            setState ({ status: "done" });
        } catch (err) {
            // Problemas con el enlace o la cuenta van a la pantalla de error; el resto (datos inválidos, sin conexión,
            // demasiados pedidos) se muestra en el formulario para poder reintentar
            if (err.code in ERROR_COPY && err.code !== "unavailable") setState (errorState (err));
            else setServerError (err.message || "No pudimos crear tu cuenta. Intentá nuevamente.");
        } finally {
            setSending (false);
        }
    };

    const selectClass = `w-full rounded-md border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:ring-2 ${errors.role ? "border-red-600 focus:border-red-600 focus:ring-red-600/20" : "border-border focus:border-primary focus:ring-primary/20"}`;

    return (
        <main className="relative min-h-screen overflow-hidden bg-background font-sans">
            <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
                <header className="flex items-center justify-between py-5">
                    <Link to="/" className="flex items-center gap-3">
                        <BrandMark />
                        <span className="text-xl font-extrabold tracking-tight text-text">RedAT</span>
                    </Link>
                    <Link to="/" className="flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary">
                        <Icon name="arrow" className="h-4 w-4" /> Volver al inicio
                    </Link>
                </header>

                <section className="flex flex-1 items-center justify-center py-10">
                    <div className="w-full max-w-xl">
                        {state.status === "loading" && (
                            <p role="status" className="text-center text-text-secondary">Verificando tu invitación...</p>
                        )}

                        {state.status === "error" && (
                            <div role="alert" className="rounded-3xl border border-border bg-surface p-8 text-center shadow-xl shadow-primary/5">
                                <h1 className="m-0 text-2xl font-bold text-text">{ERROR_COPY[state.code].title}</h1>
                                <p className="m-0 mt-3 text-text-secondary">{ERROR_COPY[state.code].text (state)}</p>
                                {ERROR_COPY[state.code].login && (
                                    <LoginButton/>
                                )}
                            </div>
                        )}

                        {state.status === "done" && (
                            <div role="status" className="rounded-3xl border border-border bg-surface p-8 text-center shadow-xl shadow-primary/5">
                                <div className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
                                    <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
                                </div>
                                <h1 className="m-0 text-2xl font-bold text-text">Tu cuenta fue creada</h1>
                                <p className="m-0 mt-3 text-text-secondary">Ya formás parte de la red de apoyo de {invitation?.patientFirstName}. Iniciá sesión con {invitation?.email} para continuar.</p>
                                <LoginButton/>
                            </div>
                        )}

                        {state.status === "ready" && invitation && (
                            <>
                                <div className="mb-8 text-center">
                                    <h1 className="m-0 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
                                        Te invitaron a la red de apoyo de <span className="text-primary">{invitation.patientFirstName}</span>
                                    </h1>
                                    <p className="m-0 mt-3 text-text-secondary">{invitation.atName} te invitó a participar del acompañamiento. Creá tu cuenta para aceptar.</p>
                                </div>

                                <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-8">
                                    <p className="m-0 mb-6 rounded-xl bg-primary/5 p-4 text-sm text-text-secondary">
                                        Vas a poder ver: <strong className="text-text">{accessLabels (invitation.access).join (", ") || "lo que el profesional habilite"}</strong>. Es información sensible: solo se comparte con quienes forman parte del acompañamiento.
                                    </p>

                                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                                        {serverError && (
                                            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">{serverError}</div>
                                        )}

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <FormField id="name" name="name" label="Nombre" placeholder="Tu nombre" value={form.name} onChange={handleChange} error={errors.name} />
                                            </div>
                                            <div>
                                                <FormField id="lastName" name="lastName" label="Apellido" placeholder="Tu apellido" value={form.lastName} onChange={handleChange} error={errors.lastName} />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="invite-email-readonly" className="mb-2 block text-sm font-medium text-text">Correo electrónico</label>
                                            <input id="invite-email-readonly" type="email" value={invitation.email} readOnly className="w-full cursor-not-allowed rounded-md border border-border bg-surface-alt px-4 py-3 text-sm text-text-secondary" />
                                            <p className="m-0 mt-1 text-xs text-text-muted">Es el correo al que llegó la invitación.</p>
                                        </div>

                                        <div className="grid gap-5 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="role" className="mb-2 block text-sm font-medium text-text">Tu rol en el acompañamiento</label>
                                                <select id="role" name="role" value={form.role} onChange={handleChange} aria-invalid={Boolean (errors.role)} aria-describedby={errors.role ? "role-error" : undefined} className={selectClass}>
                                                    <option value="">Elegí una opción</option>
                                                    {NETWORK_ROLES.map (role => <option key={role.value} value={role.value}>{role.label}</option>)}
                                                </select>
                                                {errors.role && <p id="role-error" role="alert" className="mt-1 text-sm text-red-600">{errors.role}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="relationship" className="mb-2 block text-sm font-medium text-text">Vínculo <span className="font-normal text-text-muted">(opcional)</span></label>
                                                <input id="relationship" name="relationship" type="text" maxLength={80} value={form.relationship} onChange={handleChange} placeholder={roleInfo (form.role)?.hint ?? "Ej.: madre, docente de grado"} className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                                            </div>
                                        </div>

                                        <FormField
                                            id="password" name="password" type={showPassword ? "text" : "password"} label="Contraseña" placeholder="Mínimo 8 caracteres"
                                            value={form.password} onChange={handleChange} error={errors.password} icon={<Icon name="lock" />}
                                            rightSlot={
                                                <button type="button" onClick={() => setShowPassword (v => !v)} aria-pressed={showPassword} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30">
                                                    {showPassword ? "Ocultar" : "Mostrar"}
                                                </button>
                                            }
                                        />
                                        <FormField
                                            id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} label="Repetir contraseña" placeholder="Repetí tu contraseña"
                                            value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} icon={<Icon name="lock" />}
                                        />

                                        <div>
                                            <label className="flex cursor-pointer items-start gap-3">
                                                <input id="consent" name="consent" type="checkbox" checked={form.consent} onChange={handleChange} aria-invalid={Boolean (errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} className="mt-0.5 size-5 shrink-0 accent-primary" />
                                                <span className="text-sm text-text">Me comprometo a mantener la confidencialidad de la información a la que acceda y a usarla solo para el acompañamiento.</span>
                                            </label>
                                            {errors.consent && <p id="consent-error" role="alert" className="mt-1.5 text-sm text-red-600">{errors.consent}</p>}
                                        </div>

                                        <button type="submit" disabled={sending} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70">
                                            {sending ? "Creando tu cuenta..." : "Crear mi cuenta y unirme"}
                                        </button>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </main>
    )
}
