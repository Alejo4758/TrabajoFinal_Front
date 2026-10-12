import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { registerClient } from "../../services/authService";
import FormField from "../../components/FormField/FormField";

export default function RegisterClient () {
  const navigate = useNavigate ();

  const [form, setForm] = useState ({ name: "", lastName: "", email: "", password: "", confirmPassword: "", documentType: "", documentNumber: "" });
  const [errors, setErrors] = useState ({});
  const [status, setStatus] = useState ({ type: "", message: "" });
  const [loading, setLoading] = useState (false);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim ()) newErrors.name = "El nombre es obligatorio";
    if (!form.lastName.trim ()) newErrors.lastName = "El apellido es obligatorio";
    if (!form.email.trim ()) newErrors.email = "El correo electrónico es obligatorio";
    if (form.password.length < 8) newErrors.password = "La contraseña debe tener al menos 8 caracteres";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";

    setErrors (newErrors);

    return Object.keys (newErrors).length === 0;
  };

  const handleChange = event => {
    const { name, value } = event.target;

    setForm (prevForm => ({ ...prevForm, [name]: value }));
    setErrors (prevErrors => ({ ...prevErrors, [name]: "" }));
    setStatus ({ type: "", message: "" });
  };

  const handleSubmit = async event => {
    event.preventDefault ();
    setStatus ({ type: "", message: "" });

    if (!validateForm()) {
      setStatus ({ type: "error", message: "Revisá los campos indicados" });
      return;
    }

    setLoading (true);

    try {
      const { name, lastName, email, password, documentType, documentNumber } = form;
      const result = await registerClient({ 
        name: name.trim(), 
        lastName: lastName.trim(), 
        email: email.trim(), 
        password: password.trim(),
        documentType: documentType,
        documentNumber: documentNumber.trim()
      });

      if (result.status === 201) {
        setStatus ({ type: "success", message: "Tu cuenta fue creada correctamente" });
        setTimeout(() => { navigate ("/login", { replace: true }); }, 1400);
        return;
      }
      if (result.status === 400) {
        setStatus ({ type: "error", message: result.error || "Los datos ingresados no son válidos" });
        return;
      }
      if (result.status === 409) {
        setStatus({ type: "error", message: result.error || "Ya existe una cuenta con ese correo electrónico" });
        return;
      }

      setStatus({ type: "error", message: result.error || "No se pudo completar el registro" });
    }
    catch {
      setStatus({ type: "error", message: "Ocurrió un error inesperado. Intentá nuevamente" });
    }
    finally {
      setLoading (false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-6 py-10 font-sans">
      <div className="mx-auto w-full max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold text-text sm:text-3xl">Registro como Cliente</h2>
          <section className="border border-border rounded-xl bg-surface p-6 sm:p-8">
            <form className="space-y-8" onSubmit={handleSubmit} noValidate>
              { status.message && (<div className={ status.type === "success" ? "text-success" : "text-danger" }>{ status.message }</div>) }
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
                    <label htmlFor="documentType" className="mb-2 block text-sm font-medium text-text">Tipo de documento</label>
                    <select value={form.documentType} onChange={handleChange} className="w-full rounded-md border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" id="documentType" name="documentType" required>
                      <option value="">Seleccionar</option>
                      <option value="dni">DNI</option>
                      <option value="passport">Pasaporte</option>
                    </select>
                    { errors.documentType && <p className="mt-1 text-sm text-danger">{ errors.documentType }</p> }
                  </div>
                  <div>
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