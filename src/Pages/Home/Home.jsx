import { Link } from "react-router";
import { ICONS, AT_FEATURES, USER_FEATURES } from "../../utils/constants";

function Icon ({ name, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]}/>
    </svg>
  );
}

function BrandMark({ className = "h-11 w-11" }) {
  return (
    <div
      className={`flex ${className} items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
        <path d="M12 6 6.5 17M12 6l5.5 11M6.5 17h11" opacity=".7" />
        <circle cx="12" cy="6" r="2.4" fill="currentColor" />
        <circle cx="6.5" cy="17" r="2.4" fill="currentColor" />
        <circle cx="17.5" cy="17" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

function FeaturePanel ({ description, title, items, highlighted }) {
  return (
    <div className={`rounded-3xl border p-6 sm:p-8 ${highlighted ? "border-primary/15 bg-primary/5" : "border-border bg-surface/60"}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        {description}
      </p>
      <h3 className="mt-3 text-2xl font-bold tracking-tight text-text">
        {title}
      </h3>
      <ul className="mt-6 space-y-4">
        {items.map (item => (
          <li key={item.title} className="flex gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${ highlighted ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-primary/10 text-primary"}`}>
              <Icon name={item.icon} className="h-5 w-5"/>
            </div>
            <div>
              <h4 className="font-bold text-text">
                {item.title}
              </h4>
              <p className="text-pretty mt-1.5 text-sm leading-relaxed text-text-secondary">
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoleCard ({ title, description, detail, to, cta, icon, featured }) {
  return (
    <Link to={to} className={`group flex h-full flex-col rounded-3xl border p-7 transition-all duration-300 hover:-translate-y-1 sm:p-8 ${featured ? "border-primary bg-primary text-white shadow-xl shadow-primary/20" : "border-border bg-surface hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"}`}>
      <div className="flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${featured ? "bg-white/15 text-white" : "bg-primary/10 text-primary"}`}>
          <Icon name={icon} className="h-6 w-6"/>
        </div>
        <div className={`rounded-full border p-2 transition-all duration-300 group-hover:translate-x-1 ${featured ? "border-white/40" : "border-border text-text-secondary group-hover:border-primary group-hover:bg-primary group-hover:text-white"}`}>
          <Icon name="arrow"/>
        </div>
      </div>
      <p className={`mt-7 text-xs font-semibold uppercase tracking-[0.16em] ${featured ? "text-white/80" : "text-primary"}`}>
        {detail}
      </p>
      <h3 className="mt-2 text-xl font-bold sm:text-2xl">
        {title}
      </h3>
      <p className={`mt-3 flex-1 text-sm leading-relaxed ${featured ? "text-white/85" : "text-text-secondary"}`}>
        {description}
      </p>
      <p className="mt-6 text-sm font-semibold">
        {cta}
      </p>
    </Link>
  );
}

export default function Home () {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-sans">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark/>
            <div>
              <span className="block text-xl font-extrabold tracking-tight text-text">RedAT</span>
              <span className="hidden text-[11px] tracking-wide text-text-secondary sm:block">Red de Acompañamiento Terapéutico</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-text-secondary md:inline">¿Ya tenés una cuenta?</span>
            <Link to="/login" className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:border-primary hover:text-primary">
              Iniciar sesión
            </Link>
          </div>
        </nav>
        <section className="mx-auto max-w-4xl py-20 sm:py-28 lg:py-32">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-text sm:text-6xl lg:text-7xl">
              Conectar para
              <span className="relative mx-auto mt-1 block w-fit text-primary">
                acompañar mejor
                <svg className="absolute -bottom-4 left-0 h-2 w-full text-secondary/60" viewBox="0 0 200 8" preserveAspectRatio="none" fill="none" aria-hidden="true">
                  <path d="M2 5c40-4 100-4 196 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-text-secondary sm:text-lg">
              Un espacio para acercar a quienes necesitan acompañamiento terapéutico con los profesionales que lo brindan, y facilitarles a estos la organización de cada proceso
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/registerClient" className="group inline-flex items-center justify-center gap-3 rounded-xl bg-primary px-7 py-4 font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                Busco acompañamiento
              </Link>
              <Link to="/registerAT" className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-7 py-4 font-semibold text-text transition-colors hover:border-primary/50 hover:text-primary">
                Soy profesional AT
              </Link>
            </div>
          </div>
        </section>
        <section className="border-t border-border py-16">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-pretty mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
              Todo el acompañamiento, en un solo lugar
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <FeaturePanel description="Para quien busca acompañamiento" title="Encontrá al profesional indicado" items={USER_FEATURES}/>
            <FeaturePanel highlighted description="Para acompañantes terapéuticos" title="Gestioná cada acompañamiento" items={AT_FEATURES}/>
          </div>
        </section>
        <section className="border-t border-border py-16">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-text sm:text-4xl">
              ¿Cómo querés formar parte de RedAT?
            </h2>
            <p className="mt-3 text-text-secondary">
              Elegí el perfil que mejor se adapte a lo que necesitás
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <RoleCard featured icon="users" detail="Para familias y pacientes" title="Busco un acompañante terapéutico" description="Explorá perfiles profesionales y encontrá opciones que se ajusten a tus necesidades de acompañamiento" to="/registerClient" cta="Crear cuenta"/>
            <RoleCard icon="user" detail="Para acompañantes terapéuticos" title="Quiero ofrecer mis servicios como AT" description="Creá tu perfil profesional para presentar tu experiencia y gestionar el tratamiento" to="/registerAT" cta="Crear perfil profesional"/>
          </div>
        </section>
      </div>
    </main>
  );
}