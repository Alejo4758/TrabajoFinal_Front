import { useState } from "react";
import { initials } from "../../utils/utils";
import Icon from "../Icon/Icon";

// Foto de perfil redonda. Si no hay foto, o no se puede cargar, muestra las iniciales del nombre.
// Es decorativo: el nombre tiene que estar en el texto o en el aria-label de quien lo usa
export default function Avatar ({ image, name = "", className = "size-10 text-sm" }) {
    // Se guarda qué foto falló (y no solo que falló) para volver a intentar si la foto cambia
    const [failedImage, setFailedImage] = useState (null);

    if (image && image !== failedImage) return (
        <img src={image} alt="" onError={() => setFailedImage (image)} className={`shrink-0 rounded-full object-cover ${className}`}/>
    );

    return (
        <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full bg-primary-light font-semibold text-primary ${className}`}>
            {initials (name) || <Icon name="user"/>}
        </span>
    );
}
