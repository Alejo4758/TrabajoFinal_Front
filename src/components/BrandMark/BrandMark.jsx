// Logo de RedAT: tres nodos conectados
export default function BrandMark ({ className = "h-11 w-11" }) {
    return (
        <div className={`flex ${className} items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20`}>
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
                <path d="M12 6 6.5 17M12 6l5.5 11M6.5 17h11" opacity=".7"/>
                <circle cx="12" cy="6" r="2.4" fill="currentColor"/>
                <circle cx="6.5" cy="17" r="2.4" fill="currentColor"/>
                <circle cx="17.5" cy="17" r="2.4" fill="currentColor"/>
            </svg>
        </div>
    );
}
