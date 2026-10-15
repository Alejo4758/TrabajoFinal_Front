const MOCK_ATS = [
    {
        id: 1,
        name: "María",
        lastName: "González",
        dateOfBirth: "1990-04-15",
        locality: ["Neuquén", "Plottier"],
        image: "",
        specialties: ["Niñez", "TEA", "Inclusión escolar"],
        socialPrograms: ["OSDE", "IPROSS"],
        availabilityHours: "Lunes a viernes, de 8 a 12 hs.",
    },
    {
        id: 2,
        name: "Juan",
        lastName: "Pérez",
        dateOfBirth: "1985-08-20",
        locality: ["Neuquén"],
        image: "",
        specialties: ["Adultos", "Discapacidad"],
        socialPrograms: ["IPROSS"],
        availabilityHours: "Lunes a viernes, de 14 a 18 hs.",
        experiences: [
            {
                id: 1,
                title: "Acompañante terapéutico en inclusión escolar",
                startDate: "2022-03-01T00:00:00.000Z",
                finishDate: "2024-12-01T00:00:00.000Z",
                description: "Acompañamiento a niños en el ámbito escolar, favoreciendo su integración con el grupo, la autonomía en las actividades cotidianas y la participación en las propuestas pedagógicas, en articulación con docentes y el equipo terapéutico.",
            },
            {
                id: 2,
                title: "Acompañante terapéutico en consultorio",
                startDate: "2025-02-01T00:00:00.000Z",
                finishDate: null,
                description: "Acompañamiento individual orientado al desarrollo de habilidades sociales, la organización de rutinas y el fortalecimiento de la autonomía. Registro periódico de observaciones y seguimiento de los objetivos establecidos junto al equipo profesional.",},
            {
                id: 3,
                title: "Prácticas de acompañamiento en institución",
                startDate: "2021-04-01T00:00:00.000Z",
                finishDate: "2021-11-30T00:00:00.000Z",
                description: "Participación en actividades de acompañamiento y observación, colaborando en la planificación de actividades recreativas y en el seguimiento de las pautas definidas por los profesionales responsables.",
            },
        ],
    },
    {
        id: 3,
        name: "Laura",
        lastName: "Fernández",
        dateOfBirth: "1995-02-10",
        locality: ["Cipolletti", "Neuquén"],
        image: "",
        specialties: ["TEA", "Adolescencia"],
        socialPrograms: ["OSDE", "Swiss Medical"],
        availabilityHours: "A convenir",
    },
    {
        id: 4,
        name: "Diego",
        lastName: "Romero",
        dateOfBirth: "1988-11-03",
        locality: ["General Roca", "Allen"],
        image: "",
        specialties: ["Salud mental", "Adultos"],
        socialPrograms: ["PAMI", "Medifé"],
        availabilityHours: "Lunes a miércoles, de 9 a 15 hs.",
    },
    {
        id: 5,
        name: "Camila",
        lastName: "Torres",
        dateOfBirth: "1992-06-27",
        locality: ["Plottier", "Centenario"],
        image: "",
        specialties: ["Niñez", "Inclusión escolar"],
        socialPrograms: ["IPROSS", "Medifé"],
        availabilityHours: "Lunes a viernes, de 8 a 13 hs.",
    },
    {
        id: 6,
        name: "Sofía",
        lastName: "Martínez",
        dateOfBirth: "1997-01-12",
        locality: ["Neuquén", "Centenario"],
        image: "",
        specialties: ["Adolescencia", "Discapacidad"],
        socialPrograms: ["OSDE", "Medifé"],
        availabilityHours: "Lunes a viernes, de 14 a 19 hs.",
    },
    {
        id: 7,
        name: "Nicolás",
        lastName: "Herrera",
        dateOfBirth: "1989-09-09",
        locality: ["Cipolletti", "Fernández Oro"],
        image: "",
        specialties: ["Adultos", "Salud mental"],
        socialPrograms: ["Swiss Medical", "IOSFA"],
        availabilityHours: "A convenir",
    },
    {
        id: 8,
        name: "Valentina",
        lastName: "López",
        dateOfBirth: "1994-12-01",
        locality: ["General Roca"],
        image: "",
        specialties: ["Niñez", "TEA"],
        socialPrograms: ["IPROSS", "IOSFA"],
        availabilityHours: "Lunes a viernes, de 8 a 12 hs.",
    },
    {
        id: 9,
        name: "Martín",
        lastName: "Silva",
        dateOfBirth: "1986-03-18",
        locality: ["Cinco Saltos", "Cipolletti"],
        image: "",
        specialties: ["Discapacidad", "Inclusión escolar"],
        socialPrograms: ["PAMI", "IPROSS"],
        availabilityHours: "Lunes a jueves, de 13 a 18 hs.",
    },
    {
        id: 10,
        name: "Julieta",
        lastName: "Castro",
        dateOfBirth: "1991-05-22",
        locality: ["Neuquén"],
        image: "",
        specialties: ["Tercera edad", "Adultos"],
        socialPrograms: ["PAMI", "OSDE"],
        availabilityHours: "Lunes a viernes, de 9 a 13 hs.",
    },
    {
        id: 11,
        name: "Lucas",
        lastName: "Benítez",
        dateOfBirth: "1998-07-14",
        locality: ["Allen", "General Roca"],
        image: "",
        specialties: ["TEA", "Adolescencia"],
        socialPrograms: ["Medifé", "IOSFA"],
        availabilityHours: "A convenir",
    },
    {
        id: 12,
        name: "Agustina",
        lastName: "Díaz",
        dateOfBirth: "1993-10-30",
        locality: ["Plottier", "Neuquén"],
        image: "",
        specialties: ["Salud mental", "Discapacidad"],
        socialPrograms: ["IPROSS", "OSDE"],
        availabilityHours: "Lunes a viernes, de 14 a 18 hs.",
    },
    {
        id: 13,
        name: "Federico",
        lastName: "Muñoz",
        dateOfBirth: "1987-02-26",
        locality: ["Fernández Oro", "Cipolletti"],
        image: "",
        specialties: ["Niñez", "Adolescencia"],
        socialPrograms: ["Swiss Medical", "IOSFA"],
        availabilityHours: "Lunes a miércoles, de 8 a 12 hs.",
    },
    {
        id: 14,
        name: "Paula",
        lastName: "Acosta",
        dateOfBirth: "1990-08-17",
        locality: ["Centenario", "Neuquén"],
        image: "",
        specialties: ["Tercera edad", "Discapacidad"],
        socialPrograms: ["PAMI", "IPROSS"],
        availabilityHours: "Lunes a viernes, de 10 a 16 hs.",
    },
    {
        id: 15,
        name: "Tomás",
        lastName: "Vega",
        dateOfBirth: "1984-04-07",
        locality: ["Cinco Saltos", "Allen"],
        image: "",
        specialties: ["Adultos", "Salud mental"],
        socialPrograms: ["Medifé", "OSDE"],
        availabilityHours: "A convenir",
    },
    {
        id: 16,
        name: "Rocío",
        lastName: "Navarro",
        dateOfBirth: "1996-11-11",
        locality: ["Plottier"],
        image: "",
        specialties: ["TEA", "Inclusión escolar"],
        socialPrograms: ["OSDE", "IPROSS"],
        availabilityHours: "Lunes a viernes, de 8 a 14 hs.",
    },
];

const normalize = value =>
    String(value ?? "").trim().toLocaleLowerCase("es");

const matchesList = (values, filter) => {
    if (!filter) return true;

    return values.some(value =>
        normalize(value) === normalize(filter)
    );
};

export const getATs = async (page = 1, limit = 10, filters = {}) => {
    // Simular una demora de red.
    await new Promise(resolve => setTimeout(resolve, 500));

    const filteredATs = MOCK_ATS.filter(at =>
        matchesList(at.locality, filters.locality) &&
        matchesList(at.specialties, filters.specialties) &&
        matchesList(at.socialPrograms, filters.socialPrograms)
    );

    const start = (page - 1) * limit;
    const data = filteredATs.slice(start, start + limit);

    return {
        data,
        error: null,
    };
};

export const getATById = async id => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const at = MOCK_ATS.find(item => item.id === Number(id));

    if (!at) {
        return {
            data: null,
            error: `Profesional no encontrado (ID: ${id})`,
        };
    }

    return {
        data: at,
        error: null,
    };
};