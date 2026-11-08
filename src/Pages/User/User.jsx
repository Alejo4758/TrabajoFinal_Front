import { useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { uploadAvatar } from "../../services/userService";
import { AVATAR_MAX_MB, AVATAR_TYPES, ROLES, ROLE_LABELS } from "../../utils/constants";
import { formatDate, formatDateDetail, shortName } from "../../utils/utils";
import Avatar from "../../components/Avatar/Avatar";
import Pill from "../../components/AT/Pill/Pill";
import { InfoRow } from "../../components/AT/InfoRow/InfoRow";

const CARD = "rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8";

// Perfil del usuario con sesión iniciada. Los datos salen de la sesión (los que devolvió el login), así que no hace falta pedirlos.
// Lo único que se puede cambiar por ahora es la foto: el backend todavía no tiene un endpoint para editar el resto
export default function User () {
    const { user, token, updateUser } = useAuth ();

    const [uploading, setUploading] = useState (false);
    const [error, setError] = useState ("");
    const [successMessage, setSuccessMessage] = useState ("");
    const fileInputRef = useRef (null);

    const fullName = [user.name, user.lastName].filter (Boolean).join (" ");
    const profileAT = user.role === ROLES.AT ? user.profileAT : null;

    const handleFileChange = async event => {
        const file = event.target.files?.[0];

        // Se vacía el input para que elegir de nuevo el mismo archivo (por ejemplo después de un error) vuelva a disparar el cambio
        event.target.value = "";

        if (!file) return;

        setError ("");
        setSuccessMessage ("");

        // Mismas validaciones que el backend, para avisar sin esperar a que se suba el archivo
        if (!AVATAR_TYPES.includes (file.type)) {
            setError ("Formato no válido. Elegí una imagen JPG, PNG o WEBP");
            return;
        }
        if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
            setError (`La imagen supera el tamaño máximo de ${AVATAR_MAX_MB} MB`);
            return;
        }

        setUploading (true);

        const result = await uploadAvatar (user.id, file, token);

        setUploading (false);

        if (result.error || !result.data?.profilePicture) {
            setError (result.error || "No se pudo actualizar la foto. Intentá nuevamente");
            return;
        }

        // Se guarda en la sesión para que la foto nueva se vea enseguida en toda la app (también en la barra de navegación)
        updateUser ({ profilePicture: result.data.profilePicture });
        setSuccessMessage ("Tu foto de perfil se actualizó");
    };

    return (
        <main className="min-h-page bg-background px-4 py-8 font-sans sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-3xl font-bold text-text">Mi perfil</h1>

                <section className={`${CARD} flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left`}>
                    <div className="relative shrink-0">
                        <Avatar image={user.profilePicture} name={shortName (user)} className="size-28 text-3xl"/>
                        {uploading && (
                            <div className="absolute inset-0 grid place-items-center rounded-full bg-surface/70">
                                <div className="size-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" aria-hidden="true"/>
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="break-words text-2xl font-bold text-text">{fullName || "Mi cuenta"}</h2>
                        {user.email && <p className="mt-1 break-all text-sm text-text-secondary">{user.email}</p>}
                        <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                            <Pill>{ROLE_LABELS[user.role]}</Pill>
                            {profileAT?.status === "APPROVED" && <Pill tone="success">Perfil validado</Pill>}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <input ref={fileInputRef} type="file" accept={AVATAR_TYPES.join (",")} onChange={handleFileChange} className="hidden"/>
                        <button type="button" onClick={() => fileInputRef.current?.click ()} disabled={uploading} className="cursor-pointer rounded-xl border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60">
                            {uploading ? "Subiendo foto..." : user.profilePicture ? "Cambiar foto" : "Subir foto"}
                        </button>
                        <p className="mt-2 text-xs text-text-muted">JPG, PNG o WEBP, hasta {AVATAR_MAX_MB} MB</p>
                    </div>
                </section>

                {successMessage && (
                    <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-3 text-center text-sm text-green-700">
                        {successMessage}
                    </div>
                )}
                {error && (
                    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
                        {error}
                    </div>
                )}

                <section className={CARD}>
                    <h2 className="mb-6 border-b border-border pb-4 text-xl font-bold text-text">Datos personales</h2>
                    <dl className="grid gap-5 sm:grid-cols-2">
                        <InfoRow label="Nombre">{user.name}</InfoRow>
                        <InfoRow label="Apellido">{user.lastName}</InfoRow>
                        <InfoRow label="Correo electrónico">{user.email && <span className="break-all">{user.email}</span>}</InfoRow>
                        <InfoRow label="Documento">{[user.documentType, user.documentNumber].filter (Boolean).join (" ")}</InfoRow>
                        <InfoRow label="Miembro desde">{user.createdAt && formatDateDetail (user.createdAt)}</InfoRow>
                    </dl>
                </section>

                {profileAT && (
                    <section className={CARD}>
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                            <h2 className="text-xl font-bold text-text">Perfil profesional</h2>
                            {/* El perfil público se busca por el id del perfil de AT, no por el id del usuario */}
                            <Link to={`/profileAT/at/${profileAT.id}`} className="text-sm font-semibold text-primary hover:underline">
                                Ver mi perfil público
                            </Link>
                        </div>
                        <dl className="grid gap-5 sm:grid-cols-2">
                            {/* formatDate toma el día tal como está guardado: con formatDateDetail la zona horaria lo correría un día */}
                            <InfoRow label="Fecha de nacimiento">{profileAT.dateOfBirth && formatDate (profileAT.dateOfBirth, { day: "numeric", month: "long", year: "numeric" })}</InfoRow>
                            <InfoRow label="Género">{profileAT.genre}</InfoRow>
                            <InfoRow label="Estudios">{profileAT.studies}</InfoRow>
                        </dl>
                    </section>
                )}
            </div>
        </main>
    );
}
