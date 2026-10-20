import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getATById } from '../../services/itemsService';
import { calculateAge, formatMonthYear, formatAvailability } from '../../utils/utils';

export default function ATProfile () {
    const { id } = useParams ();

    const navigate = useNavigate ();
    
    const [at, setAt] = useState (null);
    const [loading, setLoading] = useState (true);
    const [error, setError] = useState (null);

    useEffect(() => {
        const fetchProfessional = async () => {
            setLoading (true);
            const { data, error } = await getATById (id);            
            if (error) {
                setError (error);
            } else {
                const dataWithMockExperience = {
                    ...data,
                    experiences: data.experiences || [
                        {
                            id: 1,
                            title: "Acompañante Terapéutico Escolar",
                            startDate: "2023-03-01T00:00:00.000Z",
                            finishDate: null,
                            description: "Acompañamiento en nivel primario para niño con TEA. Adaptación de contenidos y mediación vincular con pares."
                        },
                        {
                            id: 2,
                            title: "AT Domiciliario - Tercera Edad",
                            startDate: "2021-06-15T00:00:00.000Z",
                            finishDate: "2023-01-10T00:00:00.000Z",
                            description: "Asistencia en actividades de la vida diaria (AVD), estimulación cognitiva y acompañamiento a turnos médicos."
                        }
                    ]
                };
                setAt (dataWithMockExperience);
            }
            setLoading (false);
        };

        fetchProfessional ();
    }, [id]);

    if (loading) return (
        <main className="flex min-h-screen items-center justify-center bg-background">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"/>
        </main>
    );

    if (error || !at) return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4">
            <div className="text-center">
                <p className="text-red-600 mb-4 font-medium">
                    {error || "No se encontró el perfil."}
                </p>
                <button className="rounded-xl border border-primary px-6 py-2 text-primary hover:bg-primary/10 transition-colors" onClick={() => navigate (-1)}>
                    Volver
                </button>
            </div>
        </main>
    );

    const profileImage = at.image || "https://avatars.githubusercontent.com/u/217831763?s=400&v=4";

    return (
        <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8 font-sans">
            <div className="mx-auto max-w-6xl">
                <button className="mb-8 text-sm font-bold text-text-secondary hover:text-primary transition-colors cursor-pointer w-fit" onClick={() => navigate ("/searchAT")}> 
                    Volver a la búsqueda
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <section className="lg:col-span-4">
                        <div className="sticky top-8 rounded-3xl border border-border bg-surface p-6 shadow-sm flex flex-col items-center text-center">
                            <img className="w-36 h-36 rounded-full border-4 border-primary/10 object-cover mb-4" src={profileImage} alt={`Foto de ${at.name}`}/>
                            <h2 className="text-2xl font-bold text-text">
                                {at.name} {at.lastName}
                            </h2>
                            <p className="text-text-secondary font-medium mb-6">
                                {calculateAge (at.dateOfBirth)} años
                            </p>
                            <button className="w-full cursor-pointer rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-md mb-8">
                                Solicitar vinculación
                            </button>
                            <div className="w-full space-y-4 text-left border-t border-border pt-6">
                                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                                    Zona de Trabajo
                                </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {at.locality.map (loc => (
                                            <span key={loc} className="inline-flex items-center text-sm text-text bg-background border border-border rounded-md px-2.5 py-1">
                                                <svg className="w-3.5 h-3.5 mr-1.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {loc}
                                            </span>
                                        ))}
                                    </div>
                                <div>
                                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 mt-4">
                                        Disponibilidad
                                    </h3>
                                    <p className="text-sm text-text bg-background border border-border rounded-md px-3 py-2">
                                        {formatAvailability (at.availability) || "A convenir"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="lg:col-span-8 space-y-8">
                        <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-text mb-6 border-b border-border pb-4">
                                Especialidades y Cobertura
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-text mb-3">
                                        Se especializa en:
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {at.specialties.map (specialty => (
                                            <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary" key={specialty}>
                                                {specialty}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>   
                                    <h3 className="text-sm font-semibold text-text mb-3">
                                        Obras Sociales aceptadas:
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {at.socialPrograms.map (program => (
                                            <span key={program} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                                {program}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="rounded-3xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-text mb-8 border-b border-border pb-4">
                                Experiencia Profesional
                            </h2>
                            {at.experiences && at.experiences.length > 0 ? (
                                <div className="relative border-l-2 border-primary/20 ml-3 space-y-10">
                                    {at.experiences.map (exp => (
                                        <div className="relative pl-6 sm:pl-8" key={exp.id}>
                                            <span className="absolute -left-2.25 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-surface"></span>
                                            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2">
                                                <h3 className="text-lg font-bold text-text leading-snug">
                                                    {exp.title}
                                                </h3>
                                                <span className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-md mt-1 sm:mt-0 w-fit">
                                                    {formatMonthYear (exp.startDate)} - {formatMonthYear (exp.finishDate)}
                                                </span>
                                            </div>
                                            {exp.description && (
                                                <p className="text-text-secondary text-sm mt-3 leading-relaxed bg-background border border-border p-4 rounded-xl">
                                                    {exp.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-text-secondary">
                                        Este perfil aún no ha cargado experiencia profesional.
                                    </p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}