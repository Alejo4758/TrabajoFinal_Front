import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams } from "react-router";
import { getATs } from "../services/itemsService";

const ATS_PER_PAGE = 9;

export const useATs = () => {
    const [searchParams, setSearchParams] = useSearchParams ();
    
    const province = searchParams.get ("province") || "";
    const department = searchParams.get ("department") || "";
    const locality = searchParams.get ("locality") || "";
    const specialties = searchParams.get ("specialties") || "";
    const socialPrograms = searchParams.get ("socialPrograms") || "";
    
    const filters = useMemo (() => ({ province, department, locality, specialties, socialPrograms }), [province, department, locality, specialties, socialPrograms,]);
    
    const [ats, setAts] = useState ([]);
    const [page, setPage] = useState (1);
    const [loading, setLoading] = useState (false);
    const [hasMore, setHasMore] = useState (true);
    const [error, setError] = useState (null);

    const requestVersion = useRef (0);
    

    useEffect (() => {
        const version = ++requestVersion.current;
        let cancelled = false;

        const fetchATs = async () => {
            setLoading (true);
            setError (null);
            setAts ([]);
            setPage (1);
            setHasMore (true);

            const result = await getATs (1, ATS_PER_PAGE, filters);

            if (cancelled || version !== requestVersion.current) return;

            if (result.error) {
                setError (result.error);
                setAts ([]);
                setHasMore (false);
            }
            else {
                const data = Array.isArray (result.data) ? result.data : [];

                setAts (data);
                setHasMore (data.length === ATS_PER_PAGE);
            }

            setLoading (false);
        };

        fetchATs ();

        return () => {
            cancelled = true;
            if (requestVersion.current === version) requestVersion.current++;
        };
    }, [filters]);

    const loadMore = useCallback (async () => {
        if (loading || !hasMore) return;

        const nextPage = page + 1;
        const version = requestVersion.current;

        setLoading (true);
        setError (null);

        const result = await getATs (nextPage, ATS_PER_PAGE, filters);

        if (version !== requestVersion.current) return;

        if (result.error) {
            setError (result.error);
        }
        else {
            const data = Array.isArray (result.data) ? result.data : [];

            setAts (previous => [...previous, ...data]);
            setPage (nextPage);
            setHasMore (data.length === ATS_PER_PAGE);
        }

        setLoading (false);
    }, [filters, hasMore, loading, page]);

    const applyFilters = useCallback (values => {
        const params = new URLSearchParams (searchParams);

        ["province", "department", "locality", "specialties", "socialPrograms"].forEach (key => {
            const value = String (values[key] ?? "").trim ();

            if (value) {
                params.set (key, value);
            } else {
                params.delete (key);
            }
        });

        setSearchParams (params);
    }, [searchParams, setSearchParams]);

    return { ats, loading, error, hasMore, filters, loadMore, applyFilters };
};