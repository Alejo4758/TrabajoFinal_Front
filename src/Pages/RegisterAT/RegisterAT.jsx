import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { registerAT } from "../../services/atServiceMock";
import FormField from "../../components/FormField/FormField";

export default function RegisterAT () {
  const [form, setForm] = useState ({ name: "", lastName: "", dateOfBirth: "", documentType: "", documentNumber: "", email: "", password: "", confirmPassword: "" });
  const [status, setStatus] = useState ({ type: '', message: '' });
  const [credentials, setCredentials] = useState (null);
  const [loading, setLoading] = useState (false);
  const [errors, setErrors] = useState ({});

  const navigate = useNavigate ()

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim ()) newErrors.name = "El nombre es obligatorio";
    if (!form.lastName.trim ()) newErrors.lastName = "El apellido es obligatorio";
    if (!form.dateOfBirth) newErrors.dateOfBirth = "La fecha de nacimiento es obligatoria";
    if (!form.documentType) newErrors.documentType = "Seleccioná un tipo de documento";
    if (!form.documentNumber.trim ()) newErrors.documentNumber = "El número de documento es obligatorio";
    if (!form.email.trim ()) newErrors.email = "El correo electrónico es obligatorio";
    if (form.password.length < 8) newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    if (!credentials) newErrors.credentials = "La documentación es obligatoria";
    
    setErrors (newErrors);

    return Object.keys (newErrors).length === 0;
  }

  const handleChange = event => {
    const { name, value } = event.target;

    setForm (prevForm => ({ ...prevForm, [name]: value, }));
    setErrors (prevErrors => ({ ...prevErrors, [name]: "" }));
    setStatus ({ type: "", message: "" });
  };

  const handleFileChange = event => {
    const file = event.target.files[0];

    setCredentials (file ?? null);
    setErrors (prevErrors => ({ ...prevErrors, credentials: "" }));
    setStatus ({ type: "", message: "" });
  };

  const handleSubmit = async event => {
    event.preventDefault ();

    if (!validateForm ()) {
      setStatus ({ type: "error", message: "Revisá los campos indicados" });
      return;
    }
    
    setLoading (true);

    try {
      const result = await registerAT (form, credentials);

      if (result.status === 201) {
        setStatus ({ type: "success", message: "Tu cuenta fue creada correctamente" });
        setTimeout (() => { navigate ("/login", { replace: true }) }, 1400);
        return;
      }
      if (result.status === 400) {
        setStatus ({ type: "error", message: result.error || "Los datos ingresados no son válidos "});
        return;
      }
      if (result.status === 409) {
        setStatus ({ type: "error", message: result.error || "Ya existe una cuenta con esos datos " });
        return;
      }

      setStatus ({ type: "error", message: result.error || "No se pudo completar el registro" });
    }
    catch {
      setStatus ({ type: "error", message: "Ocurrió un error inesperado. Intentá nuevamente" });
    }
    finally {
      setLoading (false);
    }
}

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold text-text sm:text-3xl">Registro como Acompañante Terapéutico</h2>
        <section className="border border-border rounded-xl bg-surface p-6 sm:p-8">
          <form className="space-y-8" onSubmit={handleSubmit} noValidate>
            {status.message && (
              <div className={ status.type === 'success' ? 'text-success' : 'text-danger'}>
                {status.message}
              </div>
            )}
            <fieldset>
              <legend className="text-lg font-semibold text-text">Datos personales</legend>
              <p className="mt-1 text-sm text-text-secondary mb-5">Información básica para la identificación dentro de la plataforma</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FormField 
                   label={"Nombre"}
                   value={form.name}
                   onChange={handleChange}
                   error={errors.name}  
                   placeholder={"Ingresá tu nombre"} 
                   id={"name"} 
                   name={"name"} 
                  />
                </div>
                <div>
                  <FormField 
                   label={"Apellido"}
                   value={form.lastName}
                   onChange={handleChange}
                   error={errors.lastName} 
                   placeholder={"Ingresá tu apellido"} 
                   id={"lastName"} 
                   name={"lastName"}
                  />
                </div>
                <div>
                  <FormField 
                   label={"Fecha de nacimiento"}
                   value={form.dateOfBirth}
                   onChange={handleChange}
                   error={errors.dateOfBirth} 
                   type={"date"} 
                   id={"dateOfBirth"} 
                   name={"dateOfBirth"}
                  />
                </div>
                <div>
                  <label htmlFor="documentType" className="mb-2 block text-sm font-medium text-text">Tipo de documento</label>
                  <select value={form.documentType} onChange={handleChange} className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="documentType" name="documentType" required>
                    <option value="">Seleccionar</option>
                    <option value="dni">DNI</option>
                    <option value="passport">Pasaporte</option>
                  </select>
                  {errors.documentType && <p className="mt-1 text-sm text-danger">{errors.documentType}</p>}
                </div>
                <div className="sm:col-span-2">
                  <FormField 
                   label={"Número de documento"} 
                   value={form.documentNumber}
                   onChange={handleChange}
                   error={errors.documentNumber}
                   placeholder={"Ingresá tu número de documento"} 
                   id={"documentNumber"} 
                   name={"documentNumber"}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-semibold text-text">Datos de acceso</legend>
              <p className="mt-1 text-sm text-text-secondary mb-5">Información para ingresar a la plataforma</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormField 
                   label={"Correo electrónico"} 
                   type={"email"} 
                   value={form.email}
                   onChange={handleChange}
                   error={errors.email}
                   placeholder={"Ingresá tu correo electrónico"} 
                   id={"email"} 
                   name={"email"}
                  />
                </div>
                <div>
                  <FormField 
                   label={"Contraseña"} 
                   type={"password"}
                   value={form.password} 
                   onChange={handleChange}
                   error={errors.password}
                   placeholder={"Ingresá tu contraseña"} 
                   id={"password"} 
                   name={"password"}
                  />
                </div>
                <div>
                  <FormField 
                   label={"Confirmar contraseña"} 
                   type={"password"} 
                   value={form.confirmPassword}
                   onChange={handleChange}
                   error={errors.confirmPassword}
                   placeholder={"Confirmá tu contraseña"} 
                   id={"confirmPassword"} 
                   name={"confirmPassword"}
                  />
                </div>
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-lg font-semibold text-text">Archivo de verificación</legend>
              <p className="mt-1 text-sm text-text-secondary mb-5">Adjuntá un documento que permita acreditar tu formación como acompañante terapéutico</p>
              <div>
                <label htmlFor="credentials" className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-alt px-6 py-10 text-center transition hover:border-primary hover:bg-primary-light/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary transition-transform group-hover:scale-105">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 16V4m0 0L8 8m4-4 4 4M5 20h14" />
                    </svg>
                  </div>
                  <span className="mt-4 text-sm font-medium text-text">Seleccioná tu documentación</span>
                  {credentials && (
                    <span className="mt-2 text-sm font-medium text-primary">
                      Archivo seleccionado: {credentials.name}
                    </span>
                  )}
                  <input id="credentials" name="credentials" type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" required className="sr-only"/>
                  {errors.credentials && <p className="mt-1 text-sm text-danger">{errors.credentials}</p>}
                </label>
              </div>
            </fieldset>
            <div>
              <button type="submit" disabled={loading} className="cursor-pointer w-full rounded-md bg-primary px-4 py-3.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30">
                 {loading ? "Creando cuenta..." : "Crear cuenta"}
              </button>
            </div>            
          </form>
        </section>
        <div className="mt-6 text-center">
          <p className="m-0 text-sm text-text-secondary">
            ¿Ya tenés una cuenta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">Iniciá sesión</Link>
          </p>
          <Link to="/" className="mt-3 inline-block text-sm text-text-muted hover:text-text">Volver al inicio</Link>
        </div>
      </div>
    </main>
  );
}