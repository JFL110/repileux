import itemOrList from './itemOrList'

const ensureLeadingSlash = path => path?.startsWith("/") ? path : ("/" + path);

export default ({
    name,
    middleware = [],
    reducers = {},
    slices = [],
    pages = [],
    fourOFourPages = [],
    urlPrefix = null
}) => {

    // Validate
    if (!name) throw "name is required for module";

    // Array correct
    const _pages = itemOrList(pages);

    const combinedPath = path => {
        if (typeof path !== "string") throw `Path must be a string but got ${path}`;

        const pagePathNonNull = (path ?? "");
        if (!urlPrefix) {
            return ensureLeadingSlash(pagePathNonNull);
        }

        if (urlPrefix.endsWith("/") && pagePathNonNull.startsWith("/")) {
            return ensureLeadingSlash(urlPrefix.replace(/\/$/, "") + pagePathNonNull);
        }

        return ensureLeadingSlash(urlPrefix + pagePathNonNull);
    }


    return {
        name: name,
        middleware: middleware,
        reducers: reducers,
        slices: slices,
        pages: _pages,
        fourOFourPages: fourOFourPages,
        urlPrefix: urlPrefix,
        combinedPath: combinedPath
    }
}