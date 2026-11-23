import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extension-placeholder";

// Editor de texto enriquecido de los informes. Es controlado: recibe el HTML en value y avisa cada cambio con onChange.
// Los estilos del documento (.report-prose) están en index.css, porque el reset de Tailwind deja los títulos y las listas sin formato.
//
// snippets: bloques que se insertan con un clic, [{ id, label, title, position: "start" | "end", getHtml: () => string }]

const buildExtensions = placeholder => [
  // StarterKit 3 ya trae subrayado y enlaces: el subrayado se registra aparte (con su paquete) y los enlaces no se usan en los informes
  StarterKit.configure ({ heading: { levels: [1, 2, 3] }, underline: false, link: false }),
  Underline,
  TextAlign.configure ({ types: ["heading", "paragraph"], alignments: ["left", "center", "right", "justify"], defaultAlignment: "left" }),
  Placeholder.configure ({ placeholder }),
];

// ---------- Íconos (trazo de 24 px, heredan el color del botón) ----------

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  bulletList: <Icon><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></Icon>,
  orderedList: <Icon><path d="M10 6h10M10 12h10M10 18h10M4 4v4M3 8h2M3 14.5a1.5 1.5 0 0 1 3 0c0 1.5-3 2-3 3.5h3"/></Icon>,
  blockquote: <Icon><path d="M7 7H4v5h3l-1 5M17 7h-3v5h3l-1 5"/></Icon>,
  alignLeft: <Icon><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></Icon>,
  alignJustify: <Icon><path d="M4 6h16M4 10h16M4 14h16M4 18h16"/></Icon>,
  alignRight: <Icon><path d="M4 6h16M10 10h10M4 14h16M10 18h10"/></Icon>,
  undo: <Icon><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></Icon>,
  redo: <Icon><path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/></Icon>,
};

function ToolbarButton ({ label, active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      // Evita que el editor pierda la selección al hacer clic en la barra
      onMouseDown={event => event.preventDefault ()}
      onClick={onClick}
      className={`grid h-8 min-w-8 cursor-pointer place-items-center rounded-md px-1.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-primary-light text-primary" : "text-text-secondary hover:bg-surface hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-6 w-px bg-border"/>;

function Toolbar ({ editor, snippets }) {
  // En TipTap 3 el componente no se vuelve a dibujar en cada cambio del editor: el estado de la barra se lee con useEditorState
  const state = useEditorState ({
    editor,
    selector: ({ editor: current }) => ({
      h1: current.isActive ("heading", { level: 1 }),
      h2: current.isActive ("heading", { level: 2 }),
      paragraph: current.isActive ("paragraph"),
      bold: current.isActive ("bold"),
      italic: current.isActive ("italic"),
      underline: current.isActive ("underline"),
      bulletList: current.isActive ("bulletList"),
      orderedList: current.isActive ("orderedList"),
      blockquote: current.isActive ("blockquote"),
      alignLeft: current.isActive ({ textAlign: "left" }),
      alignJustify: current.isActive ({ textAlign: "justify" }),
      alignRight: current.isActive ({ textAlign: "right" }),
      canUndo: current.can ().undo (),
      canRedo: current.can ().redo (),
    }),
  });

  const run = command => () => command (editor.chain ().focus ()).run ();

  const insertSnippet = snippet => {
    const html = snippet.getHtml ();
    if (editor.isEmpty) {
      editor.chain ().focus ().setContent (html).run ();
      return;
    }
    const position = snippet.position === "start" ? 0 : editor.state.doc.content.size;
    editor.chain ().focus ().insertContentAt (position, html).run ();
  };

  return (
    <div role="toolbar" aria-label="Formato del informe" className="flex flex-wrap items-center gap-y-1.5 border-b border-border bg-surface-alt px-2 py-1.5">
      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Título" active={state.h1} onClick={run (chain => chain.toggleHeading ({ level: 1 }))}>H1</ToolbarButton>
        <ToolbarButton label="Subtítulo de sección" active={state.h2} onClick={run (chain => chain.toggleHeading ({ level: 2 }))}>H2</ToolbarButton>
        <ToolbarButton label="Párrafo normal" active={state.paragraph && !state.bulletList && !state.orderedList && !state.blockquote} onClick={run (chain => chain.setParagraph ())}>¶</ToolbarButton>
      </div>
      <Divider/>
      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Negrita" active={state.bold} onClick={run (chain => chain.toggleBold ())}><span className="font-bold">B</span></ToolbarButton>
        <ToolbarButton label="Cursiva" active={state.italic} onClick={run (chain => chain.toggleItalic ())}><span className="font-serif italic">I</span></ToolbarButton>
        <ToolbarButton label="Subrayado" active={state.underline} onClick={run (chain => chain.toggleUnderline ())}><span className="underline underline-offset-2">U</span></ToolbarButton>
      </div>
      <Divider/>
      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Lista con viñetas" active={state.bulletList} onClick={run (chain => chain.toggleBulletList ())}>{ICONS.bulletList}</ToolbarButton>
        <ToolbarButton label="Lista numerada" active={state.orderedList} onClick={run (chain => chain.toggleOrderedList ())}>{ICONS.orderedList}</ToolbarButton>
        <ToolbarButton label="Cita o recuadro destacado" active={state.blockquote} onClick={run (chain => chain.toggleBlockquote ())}>{ICONS.blockquote}</ToolbarButton>
      </div>
      <Divider/>
      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Alinear a la izquierda" active={state.alignLeft} onClick={run (chain => chain.setTextAlign ("left"))}>{ICONS.alignLeft}</ToolbarButton>
        <ToolbarButton label="Justificar" active={state.alignJustify} onClick={run (chain => chain.setTextAlign ("justify"))}>{ICONS.alignJustify}</ToolbarButton>
        <ToolbarButton label="Alinear a la derecha" active={state.alignRight} onClick={run (chain => chain.setTextAlign ("right"))}>{ICONS.alignRight}</ToolbarButton>
      </div>
      <Divider/>
      <div className="flex items-center gap-0.5">
        <ToolbarButton label="Deshacer" disabled={!state.canUndo} onClick={run (chain => chain.undo ())}>{ICONS.undo}</ToolbarButton>
        <ToolbarButton label="Rehacer" disabled={!state.canRedo} onClick={run (chain => chain.redo ())}>{ICONS.redo}</ToolbarButton>
      </div>

      {snippets.length > 0 && (
        <div className="flex w-full flex-wrap gap-1.5 border-t border-border pt-1.5 sm:ml-auto sm:w-auto sm:border-t-0 sm:pt-0">
          {snippets.map (snippet => (
            <button
              key={snippet.id}
              type="button"
              title={snippet.title}
              onMouseDown={event => event.preventDefault ()}
              onClick={() => insertSnippet (snippet)}
              className="cursor-pointer rounded-md border border-dashed border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary-light focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              + {snippet.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// readOnly: bloquea la edición mientras la IA está trabajando sobre el informe (así no se pisan los cambios)
export default function ReportEditor ({ id, value, onChange, snippets = [], label = "Contenido del informe", placeholder = "Escribí el informe o generá un borrador con el asistente…", readOnly = false }) {
  const onChangeRef = useRef (onChange);

  useEffect (() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor ({
    extensions: buildExtensions (placeholder),
    content: value || "",
    editorProps: {
      attributes: {
        id,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": label,
        lang: "es",
        spellcheck: "true",
        class: "report-prose min-h-[420px] px-5 py-6 focus:outline-none sm:px-10 sm:py-8",
      },
    },
    onUpdate: ({ editor: current }) => onChangeRef.current?.(current.getHTML ()),
  });

  // El contenido cambia desde afuera al generar un borrador, abrir un informe guardado o empezar uno nuevo
  useEffect (() => {
    if (!editor || editor.isDestroyed) return;
    if ((value || "") !== editor.getHTML ()) editor.commands.setContent (value || "", { emitUpdate: false });
  }, [editor, value]);

  // Sin emitir update: bloquear o desbloquear no es un cambio del contenido
  useEffect (() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable (!readOnly, false);
  }, [editor, readOnly]);

  if (!editor) return null;

  return (
    <div aria-busy={readOnly || undefined} className={`overflow-hidden rounded-xl border border-border bg-surface transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 ${readOnly ? "pointer-events-none opacity-60" : ""}`}>
      <Toolbar editor={editor} snippets={snippets}/>
      {/* Hoja del documento: ancho de lectura cómodo, como en la versión impresa */}
      <div className="bg-background/60 sm:p-4">
        <div className="mx-auto max-w-[820px] bg-surface sm:rounded-lg sm:border sm:border-border sm:shadow-sm">
          <EditorContent editor={editor}/>
        </div>
      </div>
    </div>
  );
}
