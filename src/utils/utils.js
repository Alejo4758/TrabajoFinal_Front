 export const calculateAge = dateOfBirth => {
    if (!dateOfBirth) return "--";        
    const birth = new Date (dateOfBirth);
    if (isNaN (birth.getTime ())) return "--";
    const today = new Date ();
    let age = today.getFullYear () - birth.getFullYear ();
    if (today.getMonth () < birth.getMonth () || (today.getMonth () === birth.getMonth () && today.getDate () < birth.getDate ())) age--;
    return age;
};

export const formatMonthYear = dateString => {
    if (!dateString) return "Actualidad";
    const date = new Date (dateString);
    return date.toLocaleDateString ('es-AR', { month: 'short', year: 'numeric' }).replace ('.', '');
    };