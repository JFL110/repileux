/**
 * Invalidation keys can be used to clear OpState data when other state changes.
 * For example, an invalidation key might be 'username', which, when changed, invalidates
 * all data related to the user from the application state.
 * 
 * TODO
 */
export default ({
    name
}) => {
    // Validate
    if (!name) throw "name is required for createInvalidationKey";

    var getSetRef = {
        get: () => { throw "Not initialised." },
        set: () => { throw "Not initialised." }
    };

    return {
        name: name,
        get: () => getSetRef.get(),
        set: v => getSetRef.set(v),
        __getSetHandle: v => getSetRef = v
    }
}