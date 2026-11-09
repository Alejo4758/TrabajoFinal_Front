import { useCallback, useEffect, useState } from "react";
import { getMyPatients } from "../services/patientService";
import { useAuth } from "./useAuth";

// Personas a cargo del usuario logueado (rol CLIENT). Las usan la página "Personas acompañadas" y los modales
// de solicitud y de entrevista, para elegir a quién corresponde cada pedido
export const useMyPatients = () => {
    const { token } = useAuth ();

    const [patients, setPatients] = useState ([]);
    const [loading, setLoading] = useState (true);
    const [error, setError] = useState ("");

    useEffect (() => {
        let cancelled = false;

        getMyPatients (token).then (result => {
            if (cancelled) return;
            setPatients (Array.isArray (result.data) ? result.data : []);
            setError (result.error || "");
            setLoading (false);
        });

        return () => {
            cancelled = true;
        };
    }, [token]);

    // Suma a la lista una persona recién cargada, o reemplaza la que se editó, sin volver a pedirlas todas
    const upsertPatient = useCallback (patient => {
        setPatients (previous => previous.some (item => item.id === patient.id) ? previous.map (item => item.id === patient.id ? patient : item) : [...previous, patient]);
    }, []);

    return { patients, loading, error, upsertPatient };
};
