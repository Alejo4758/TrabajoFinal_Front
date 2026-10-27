
const MOCK_DELAY_MS = 500;

// PDF público de prueba. Es un archivo genérico, no un título profesional real.
const MOCK_PDF_URL =
  "/documents/TP-N3.pdf";

let nextValidationId = 1;

let mockProfiles = [
  {
    id: 101,
    dateOfBirth: "1992-05-14T00:00:00.000Z",
    studies: "Tecnicatura en Acompañamiento Terapéutico",
    genre: "Femenino",
    status: "PENDING",

    user: {
      id: 201,
      name: "María",
      lastName: "Fernández",
      email: "maria.fernandez@example.com",
      documentType: "DNI",
      documentNumber: "DEMO-1001",
      createdAt: "2026-10-16T10:30:00.000Z",
    },

    documents: [
      {
        id: 1001,
        title: "Título profesional",
        fileUrl: MOCK_PDF_URL,
        createdAt: "2026-10-16T10:35:00.000Z",
      },
      {
        id: 1002,
        title: "Certificado de formación",
        fileUrl: MOCK_PDF_URL,
        createdAt: "2026-10-16T10:40:00.000Z",
      },
      {
        id: 1003,
        title: "Documentación complementaria",
        fileUrl: MOCK_PDF_URL,
        createdAt: "2026-10-16T10:45:00.000Z",
      },
    ],

    validations: [],
  },

  {
    id: 102,
    dateOfBirth: "1988-11-22T00:00:00.000Z",
    studies: "Formación en Acompañamiento Terapéutico",
    genre: "Masculino",
    status: "PENDING",

    user: {
      id: 202,
      name: "Juan",
      lastName: "Rodríguez",
      email: "juan.rodriguez@example.com",
      documentType: "DNI",
      documentNumber: "DEMO-1002",
      createdAt: "2026-10-17T14:20:00.000Z",
    },

    documents: [
      {
        id: 1004,
        title: "Constancia de estudios",
        fileUrl: MOCK_PDF_URL,
        createdAt: "2026-10-17T14:25:00.000Z",
      },
    ],

    validations: [],
  },

  {
    id: 103,
    dateOfBirth: "1995-03-08T00:00:00.000Z",
    studies: "Estudios en curso",
    genre: "Femenino",
    status: "PENDING",

    user: {
      id: 203,
      name: "Laura",
      lastName: "Gómez",
      email: "laura.gomez@example.com",
      documentType: "DNI",
      documentNumber: "DEMO-1003",
      createdAt: "2026-10-18T09:15:00.000Z",
    },

    // Este perfil permite comprobar el caso sin documentos.
    documents: [],

    validations: [],
  },
];

const delay = (milliseconds = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const clone = (value) => JSON.parse(JSON.stringify(value));

// Obtener los perfiles pendientes.
export const getPendingATProfiles = async () => {
  await delay();

  const pendingProfiles = mockProfiles
    .filter((profile) => profile.status === "PENDING")
    .sort((a, b) => b.id - a.id);

  return {
    data: clone(pendingProfiles),
    error: null,
  };
};

// Simular la aprobación o el rechazo de un perfil.
export const reviewATProfile = async (
  profileId,
  { status, observations = "" }
) => {
  await delay();

  const profile = mockProfiles.find(
    (item) => item.id === Number(profileId)
  );

  if (!profile) {
    return {
      data: null,
      error: "No se encontró el perfil solicitado.",
    };
  }

  if (profile.status !== "PENDING") {
    return {
      data: null,
      error: "El perfil ya fue revisado.",
    };
  }

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return {
      data: null,
      error: "El estado seleccionado no es válido.",
    };
  }

  if (status === "APPROVED" && profile.documents.length === 0) {
    return {
      data: null,
      error: "No se puede aprobar un perfil sin documentos.",
    };
  }

  if (status === "REJECTED" && !observations.trim()) {
    return {
      data: null,
      error: "Debés indicar el motivo del rechazo.",
    };
  }

  const now = new Date().toISOString();

  // Simular la actualización del estado del perfil.
  profile.status = status;

  // Simular el registro de la revisión administrativa.
  const validation = {
    id: nextValidationId++,
    status,
    observations: observations.trim() || null,
    createdAt: now,
    updatedAt: now,
    adminId: 1,
  };

  profile.validations.unshift(validation);

  return {
    data: {
      profileId: profile.id,
      status: profile.status,
      validation: clone(validation),
    },
    error: null,
  };
};


export const getATProfiles = async () => {
  await delay();

  return {
    data: clone(
      [...mockProfiles].sort((a, b) => b.id - a.id)
    ),
    error: null,
  };
};