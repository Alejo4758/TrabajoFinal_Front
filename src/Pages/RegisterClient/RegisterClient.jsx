import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { registerAT, registerClient } from "../../services/authService";
import { EMAIL_REGEX } from "../../utils/constants";
import FormField from "../../components/FormField/FormField";
import Icon from "../../components/Icon/Icon";

function BrandMark({ className = "h-11 w-11" }) {
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

export default function RegisterAT() {
  const navigate = useNavigate ();

  const [formData, setFormData] = useState ({ name: "", lastName: "", documentType: "", documentNumber: "", email: "", password: "", confirmPassword: "", rol: "CLIENTE" });
  const [error, setError] = useState (null);
  const [success, setSuccess] = useState (null);
  const [isLoading, setIsLoading] = useState (false);
  const [fieldErrors, setFieldErrors] = useState ({});
  const [touched, setTouched] = useState ({});
  const [showPassword, setShowPassword] = useState (false);
  const [showConfirmPassword, setShowConfirmPassword] = useState (false);

  const validate = data => {
    const errors = {};

    if (!data.name.trim () )errors.name = "El nombre es obligatorio";
    if (!data.lastName.trim ()) errors.lastName = "El apellido es obligatorio";
    if (!data.documentType) errors.documentType = "Seleccioná un tipo de documento";
    if (!data.documentNumber.trim ()) errors.documentNumber = "El número de documento es obligatorio";

    const cleanEmail = data.email.trim ();

    if (!cleanEmail) {
      errors.email = "El correo es obligatorio";
    } else if (cleanEmail.length > 254) {
      errors.email = "El correo es demasiado largo";
    } else if (cleanEmail.includes ("..")) {
      errors.email = "El correo no puede tener puntos consecutivos";
    } else if (!EMAIL_REGEX.test (cleanEmail)) {
      errors.email = "Ingresá un correo válido";
    }

    if (!data.password) {
      errors.password = "La contraseña es obligatoria";
    } else if (data.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres";
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = "Confirmá tu contraseña";
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    return errors;
  };

  const handleChange = event => {
    const { name, value } = event.target;

    const updatedForm = { ...formData, [name]: value };

    setFormData (updatedForm);
    setError (null);
    setSuccess (null);

    if (touched[name]) setFieldErrors (prevErrors => ({ ...prevErrors, [name]: validate (updatedForm)[name] || "" }));

    if (name === "password" && touched.confirmPassword) {
      setFieldErrors(prevErrors => ({ ...prevErrors, confirmPassword: validate (updatedForm).confirmPassword || "" }));
    }
  };

  const handleBlur = event => {
    const { name } = event.target;

    setTouched (prev => ({ ...prev, [name]: true }));
    setFieldErrors (prevErrors => ({ ...prevErrors, [name]: validate (formData)[name] || "" }));
  };

  const handleSubmit = async event => {
    event.preventDefault ();

    const errors = validate (formData);

    setFieldErrors (errors);
    setTouched ({ name: true, lastName: true, documentType: true, documentNumber: true, email: true, password: true, confirmPassword: true });

    const firstInvalid = Object.keys (errors)[0];

    if (firstInvalid) {
      document.getElementById (firstInvalid)?.focus ();
      return;
    }

    setIsLoading (true);
    setError (null);
    setSuccess (null);

    try {
      const result = await registerClient ( { ...formData, email: formData.email.trim () });

      if (result.status === 201) {
        setSuccess ("Tu cuenta fue creada correctamente. Redirigiendo al inicio de sesión...");
        setTimeout (() => { navigate ("/login", { replace: true }); }, 1400);
        return;
      }
      if (result.status === 400) {
        setError (result.error || "Los datos ingresados no son válidos");
        return;
      }
      if (result.status === 409) {
        setError (result.error || "Ya existe una cuenta con esos datos");
        return;
      }

      setError (result.error || "No se pudo completar el registro");
    }
    catch (err) {
      setError (err.message || "Ocurrió un error inesperado. Intentá nuevamente");
    }
    finally {
      setIsLoading (false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background font-sans">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark/>
            <span className="text-xl font-extrabold tracking-tight text-text">
              RedAT
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-text-secondary transition hover:text-primary">
            <Icon name="arrow" className="h-4 w-4"/>Volver al inicio
          </Link>
        </header>
        <section className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-pretty m-0 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
                Creá tu <span className="text-pretty text-primary">cuenta</span>
              </h2>
              <p className="m-0 mt-3 text-text-secondary">
                Completá los siguientes campos para continuar
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-8">
              <form onSubmit={handleSubmit} noValidate className="space-y-8">
                <fieldset className="space-y-5">
                  <div>
                    <legend className="text-lg font-bold text-text">
                      Datos personales
                    </legend>
                    <p className="mt-1 text-sm text-text-secondary">
                      Información básica para identificarte dentro de la plataforma
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField id="name" name="name" label="Nombre" placeholder="Ingresá tu nombre" value={formData.name} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.name}/>
                    <FormField id="lastName" name="lastName" label="Apellido" placeholder="Ingresá tu apellido" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.lastName}/>
                    <div>
                      <label htmlFor="documentType" className="mb-2 block text-sm font-medium text-text">
                        Tipo de documento
                      </label>
                      <select id="documentType" name="documentType" value={formData.documentType} onChange={handleChange} onBlur={handleBlur} className={`w-full rounded-md border bg-surface px-4 py-3 text-sm text-text outline-none transition focus:ring-2 focus:ring-primary/20 ${fieldErrors.documentType ? "border-red-600 focus:border-red-600" : "border-border focus:border-primary"}`}>
                        <option value="">
                          Seleccionar
                        </option>
                        <option value="dni">
                          DNI
                        </option>
                        <option value="passport">
                          Pasaporte
                        </option>
                      </select>
                      {fieldErrors.documentType && (
                        <p className="mt-1 text-sm text-danger">
                          {fieldErrors.documentType}
                        </p>
                      )}
                    </div>
                    <div>
                      <FormField id="documentNumber" name="documentNumber" label="Número de documento" placeholder="Ingresá tu número de documento" value={formData.documentNumber} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.documentNumber}/>
                    </div>
                  </div>
                </fieldset>
                <fieldset className="space-y-5">
                  <div>
                    <legend className="text-lg font-bold text-text">
                      Datos de acceso
                    </legend>
                    <p className="mt-1 text-sm text-text-secondary">
                      Información que utilizarás para ingresar a RedAT
                    </p>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FormField id="email" name="email" type="email" label="Correo electrónico" placeholder="ejemplo@correo.com" value={formData.email} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.email} icon={<Icon name="mail"/>}/>
                    </div>
                    <FormField id="password" name="password" type={showPassword ? "text" : "password"} label="Contraseña" placeholder="Ingresá tu contraseña" value={formData.password} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.password} icon={<Icon name="lock"/>}
                      rightSlot={
                        <button type="button" onClick={() => setShowPassword (prev => !prev)} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {showPassword ? "Ocultar" : "Mostrar"}
                        </button>
                      }
                    />
                    <FormField id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} label="Confirmar contraseña" placeholder="Confirmá tu contraseña" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.confirmPassword} icon={<Icon name="lock"/>}
                      rightSlot={
                        <button type="button" onClick={() => setShowConfirmPassword(prev => !prev) } className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/30">
                          {showConfirmPassword ? "Ocultar" : "Mostrar"}
                        </button>
                      }
                    />
                  </div>
                </fieldset>
                <div className="space-y-4">
                  <button type="submit" disabled={isLoading} className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold text-white shadow-lg shadow-primary/20 transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${isLoading ? "cursor-not-allowed bg-primary/70" : "cursor-pointer bg-primary hover:-translate-y-0.5 hover:bg-primary-hover"}`}>
                    {isLoading && (
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".3" strokeWidth="3"/>
                        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    )}
                    {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                  </button>
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-700">
                      {success}
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="mt-8 text-center">
              <p className="m-0 text-sm text-text-secondary">
                ¿Ya tenés una cuenta?
              </p>
              <p className="m-0 mt-2 text-sm font-semibold">
                <Link to="/login" className="text-primary hover:underline">
                  Iniciá sesión
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}