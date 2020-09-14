
import isFunction from './isFunction'

const autoIdPrefix = "__autoId";
var autoId = 0;

export default ({
    id = null,
    path = "/",
    component,
    onLoad = null,
    onFirstLoad = null,
    lazyWrap = false,
    is404 = false,
    additions = {},
}) => {

    // Validation
    if (!path && !is404) throw "path is required for non-404 page";
    if (!component) throw "component is required for page";
    if (onLoad && !isFunction(onLoad)) throw "onLoad must be a function for page";
    if (onFirstLoad && !isFunction(onFirstLoad)) throw "onFirstLoad must be a function for page";
    if (lazyWrap && !isFunction(component)) throw "To use lazyWrap, component must be a function that imports the component, e.g. () => import('./myComponent')"

    return {
        id: id || (autoIdPrefix + autoId++),
        path: is404 ? null : path,
        component: component,
        onLoad: onLoad,
        onFirstLoad: onFirstLoad,
        lazyWrap: lazyWrap,
        is404: is404,
        additions: additions ?? {}
    }
}