export const registerAT = async (form, credentials) => {
  // Simular el tiempo que tardaría en responder el servidor
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simular que el correo ya existe
  if (form.email.toLowerCase() === 'existente@redat.test') {
    return {
      status: 409,
      data: null,
      error: 'Ya existe una cuenta con ese correo electrónico.',
    };
  }

  // Simular un error del servidor
  if (form.email.toLowerCase() === 'error@redat.test') {
    return {
      status: 500,
      data: null,
      error: 'Ocurrió un error interno en el servidor.',
    };
  }

  // Simular un registro exitoso
  return {
    status: 201,
    data: {
      message: 'Registro simulado correctamente.',
    },
    error: null,
  };
};


export const registerClient = async form => {
  // Simular el tiempo de respuesta del servidor
  await new Promise((resolve) => setTimeout(resolve, 800));

  const email = form.email.trim().toLowerCase();

  // Simular que el correo ya existe
  if (email === "existente@redat.test") {
    return {
      status: 409,
      data: null,
      error: "Ya existe una cuenta con ese correo electrónico.",
    };
  }

  // Simular un error del servidor
  if (email === "error@redat.test") {
    return {
      status: 500,
      data: null,
      error: "Ocurrió un error interno en el servidor.",
    };
  }

  // Simular un registro exitoso
  return {
    status: 201,
    data: {
      message: "Registro simulado correctamente.",
    },
    error: null,
  };
};
