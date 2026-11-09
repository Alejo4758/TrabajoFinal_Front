import { useRef, useState } from "react";
import { findSimilarOptions, sameName } from "../../utils/catalogMatch";
import { SELECT_CLASS, SUGGESTION_NAME_MAX, SUGGESTION_NAME_MIN, SUGGESTIONS_MAX } from "./formShared";

const LINK_BUTTON = "shrink-0 cursor-pointer rounded-lg border border-primary/40 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-default disabled:border-border disabled:text-text-muted disabled:hover:bg-transparent";

// Los botones del campo no le sacan el foco al texto: si no, al tocarlos se dispararía el onBlur que agrega lo escrito
const keepFocus = event => event.preventDefault ();

// Cómo se resolvió una sugerencia aprobada. reviewNote dice si ya estaba en la lista con otro nombre o con qué nombre se agregó
const approvedText = item => `${item.reviewNote || "Se aprobó"}. Quedó marcada en tu perfil.`;

// "Otra que no está en la lista": el A.T. escribe una especialidad u obra social que falta y queda esperando que un
// administrador la revise. Se envía al guardar el perfil. Mientras escribe, se le muestran las opciones de la lista que
// se parecen, para que marque la que ya existe en vez de sugerirla con otro nombre.
// value = nombres pendientes; options = catálogo; selected = ids marcados; onPick (id) marca una opción de la lista;
// approved y rejected = revisadas hace poco ([{ name, reviewNote }])
export default function SuggestionField ({ id, kind, options, selected, value, onChange, onPick, approved = [], rejected = [] }) {
    const [open, setOpen] = useState (value.length > 0);
    const [draft, setDraft] = useState ("");
    const [error, setError] = useState ("");
    // Opción de la lista que tiene el mismo nombre que lo escrito (con otra escritura): se ofrece marcarla
    const [listed, setListed] = useState (null);
    const containerRef = useRef (null);

    const checked = open || value.length > 0;
    const similar = draft.trim ().length >= 3 ? findSimilarOptions (draft, options) : [];

    const toggle = event => {
        setOpen (event.target.checked);
        setError ("");
        setListed (null);
        // Destildar "Otra" retira las sugerencias que todavía no se revisaron
        if (!event.target.checked) onChange ([]);
    };

    const changeDraft = event => {
        setDraft (event.target.value);
        setError ("");
        setListed (null);
    };

    const add = () => {
        const name = draft.trim ().replace (/\s+/g, " ");
        const match = options.find (option => sameName (option.name, name));

        if (!name) return;
        if (name.replace (/[^\p{L}\p{N}]/gu, "").length < SUGGESTION_NAME_MIN) return setError (`Escribí al menos ${SUGGESTION_NAME_MIN} letras o números`);
        if (match) {
            setListed (match);
            return setError (match.name === name ? `"${match.name}" ya está en la lista` : `"${name}" ya está en la lista como "${match.name}"`);
        }
        if (value.some (item => sameName (item, name))) return setError ("Ya la agregaste");

        onChange ([...value, name]);
        setDraft ("");
        setError ("");
    };

    const pick = option => {
        onPick (option.id);
        setDraft ("");
        setError ("");
        setListed (null);
    };

    // Al salir del campo se agrega lo escrito (si fue directo a guardar sin tocar "Sugerir"), salvo que vaya a otro control del campo
    const handleBlur = event => {
        if (containerRef.current?.contains (event.relatedTarget)) return;
        add ();
    };

    const pickButton = option => (
        <button type="button" onMouseDown={keepFocus} onClick={() => pick (option)} disabled={selected.includes (option.id)} className={LINK_BUTTON}>
            {selected.includes (option.id) ? "Ya la marcaste" : "Marcar esta"}
        </button>
    );

    return (
        <div className="space-y-3">
            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-text">
                <input type="checkbox" checked={checked} onChange={toggle} className="size-4 accent-primary"/>
                Otra que no está en la lista
            </label>

            {checked && (
                <div ref={containerRef} className="space-y-3 rounded-xl border border-border bg-background p-4">
                    <p className="text-sm text-text-secondary">
                        Antes de sugerirla, fijate que no esté arriba con otro nombre. Un administrador la va a revisar: si la aprueba, se suma a la lista y queda marcada en tu perfil. Se envía al guardar.
                    </p>

                    {value.length > 0 && (
                        <ul className="flex flex-wrap gap-2" aria-label={`${kind} sugeridas`}>
                            {value.map (name => (
                                <li key={name} className="flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 py-1 pl-3 pr-1 text-sm text-amber-900">
                                    <span>{name} <span className="text-xs">· Pendiente de revisión</span></span>
                                    <button type="button" onClick={() => onChange (value.filter (item => item !== name))} aria-label={`Retirar la sugerencia ${name}`} className="grid size-6 cursor-pointer place-items-center rounded-full transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-primary/30">
                                        <span aria-hidden="true">×</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {value.length < SUGGESTIONS_MAX ? (
                        <div>
                            <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-text-secondary">¿Cuál?</label>
                            <div className="flex gap-2">
                                <input id={id} type="text" value={draft} maxLength={SUGGESTION_NAME_MAX} onChange={changeDraft} onBlur={handleBlur}
                                    onKeyDown={event => {
                                        // Enter agrega la sugerencia en vez de enviar el formulario
                                        if (event.key === "Enter") {
                                            event.preventDefault ();
                                            add ();
                                        }
                                    }}
                                    aria-invalid={Boolean (error)} aria-describedby={error ? `${id}-error` : similar.length ? `${id}-similar` : undefined}
                                    className={`${SELECT_CLASS} ${error ? "border-red-600" : ""}`}
                                />
                                <button type="button" onMouseDown={keepFocus} onClick={add} disabled={!draft.trim ()} className="shrink-0 cursor-pointer rounded-md border border-border px-4 text-sm font-semibold transition hover:bg-surface-alt focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60">
                                    Sugerir
                                </button>
                            </div>

                            {error && (
                                <div id={`${id}-error`} className="mt-2 flex flex-wrap items-center gap-2 text-sm text-red-600">
                                    <span>{error}</span>
                                    {listed && pickButton (listed)}
                                </div>
                            )}

                            {!error && similar.length > 0 && (
                                <div id={`${id}-similar`} className="mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                    <p className="text-xs font-medium text-text-secondary">¿Es alguna de estas? Ya están en la lista:</p>
                                    <ul className="mt-2 space-y-1.5">
                                        {similar.map (option => (
                                            <li key={option.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-text">
                                                {option.name}
                                                {pickButton (option)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-text-secondary">Podés tener hasta {SUGGESTIONS_MAX} sugerencias esperando revisión.</p>
                    )}
                </div>
            )}

            {(approved.length > 0 || rejected.length > 0) && (
                <ul className="space-y-1 text-sm text-text-secondary" aria-label={`Sugerencias de ${kind.toLowerCase ()} revisadas`}>
                    {approved.map (item => (
                        <li key={`approved-${item.name}`}>
                            Tu sugerencia <span className="font-medium text-text">"{item.name}"</span>: {approvedText (item)}
                        </li>
                    ))}
                    {rejected.map (item => (
                        <li key={`rejected-${item.name}`}>
                            No se aprobó <span className="font-medium text-text">"{item.name}"</span>{item.reviewNote && `: ${item.reviewNote}`}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
