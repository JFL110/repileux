
import isFunction from './isFunction'
import itemOrList from './itemOrList';

const autoIdPrefix = "__autoId";
var autoId = 0;

export default ({
    id = null,
    paths = "/",
    component,
    onLoad = null,
    onFirstLoad = null,
    lazyWrap = false,
    is404 = false,
    meta = {},
    additions = {},
}) => {

    // Array correct
    var _paths = itemOrList(paths);

    // Validation
    if ((_paths.length == 0 || _paths.every(p => !p)) && !is404) throw "path is required for non-404 page";
    if (!component) throw "component is required for page";
    if (onLoad && !isFunction(onLoad)) throw "onLoad must be a function for page";
    if (onFirstLoad && !isFunction(onFirstLoad)) throw "onFirstLoad must be a function for page";
    if (lazyWrap && !isFunction(component)) throw "To use lazyWrap, component must be a function that imports the component, e.g. () => import('./myComponent')"



    return {
        id: id || (autoIdPrefix + autoId++),
        paths: _paths,
        component: component,
        onLoad: onLoad,
        onFirstLoad: onFirstLoad,
        lazyWrap: lazyWrap,
        is404: is404,
        meta: meta,
        additions: additions ?? {}
    }
}