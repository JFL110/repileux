import { ConnectedRouter } from 'connected-react-router'
import AppContainer from './appContainer'
import { render } from 'react-dom'
import { configureStore, getDefaultMiddleware, combineReducers } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { getStore, setStore } from './globalStore'
import { routerMiddleware, connectRouter } from 'connected-react-router'
import { createBrowserHistory } from 'history'
import loggingMiddleware from './loggingMiddleware'
import createModule from './createModule'
import pageChangeMiddleware from './pageChangeMiddleware'
import appSlice from './appSlice'
import createPage from './createPage'
import isFunction from './isFunction'
import itemOrList from './itemOrList'

// Defaults
const defaultRootPageElementId = 'root';
const defaultModuleName = "__root";
const defaultLazyPageFallback = null;
const default404PageComponent = "Unknown page";
const default404PageId = "__default404page";

/**
 * 
 */
export default ({
    // If true, console log all redux actions
    logReduxActions = false,

    // Modules
    modules = [],

    // Default module contribution,
    middleware = [],
    pages = [],
    reducers = [],
    default404Page = true,
    fourOFourPage = null,
    fourOFourPageComponent = null,

    // Page wrappers
    pageWrappers = [],

    // React
    rootPageElementId = null,
    rootPageElement = null,
    lazyPageFallback = null,
    renderFunction = null,
}) => {

    // Array correct
    const _pages = itemOrList(pages);
    const _pageWrappers = itemOrList(pageWrappers);
    const _modules = itemOrList(modules);

    // Validate
    if (rootPageElementId && rootPageElement) throw "Cannot specify both rootPageElementId and rootPageElement";
    if (fourOFourPage && fourOFourPageComponent) throw "Cannot specify both fourOFourPage and fourOFourPageComponent";
    if (!default404Page && (fourOFourPage || fourOFourPageComponent)) throw "Cannot specify noDefault404Page with either fourOFourPage or fourOFourPageComponent";
    if (_pageWrappers && _pageWrappers.some(p => !isFunction(p))) throw "pageWrappers must be functions";
    if (renderFunction && (rootPageElementId || rootPageElement)) throw "Cannot specify both renderFunction and either rootPageElementId or rootPageElement";

    // 404 Page
    const root404Page = default404Page && (fourOFourPage || createPage({
        id: default404PageId,
        component: fourOFourPage || default404PageComponent,
        is404: true,
    }));

    if (root404Page && !root404Page.is404) throw "404 page must be marked as a 404 page";

    // Default module
    const defaultModule = createModule({
        name: defaultModuleName,
        middleware: middleware,
        pages: _pages,
        fourOFourPages: root404Page ? [root404Page] : [],
        reducers: {
            app: appSlice.reducer,
            ...reducers
        }
    });

    // Merge modules
    const allModules = [defaultModule, ..._modules];

    // Configure react router
    const history = createBrowserHistory({});

    const combinedReducers = {
        router: connectRouter(history), // React router
    };

    allModules.forEach(m => {
        for (const [name, reducer] of Object.entries(m.reducers)) {
            if (combinedReducers[name]) throw `Duplicate reducer found named ${name}. Reducers must have unique names. Duplicate is from module ${m.name}.`
            combinedReducers[name] = reducer;
        }

        m.slices.forEach(s => {
            if (combinedReducers[s.name]) throw `Duplicate reducer found named ${s.name}. Reducers must have unique names. Duplicate is slice from module ${m.name}.`
            combinedReducers[s.name] = s.reducer;
        });
    });

    // Configure redux
    setStore(configureStore({
        reducer: combineReducers(combinedReducers),
        middleware: [
            ...(logReduxActions ? [loggingMiddleware] : []),
            routerMiddleware(history),
            ...allModules.flatMap(m => m.middleware),
            pageChangeMiddleware(allModules),
            ...getDefaultMiddleware()
        ],
    }));

    // Fire pre first render
    getStore().dispatch(appSlice.actions.onPreFirstRender());

    // React

    const renderToElement = rootPageElement || document.getElementById(rootPageElementId || defaultRootPageElementId);
    if (!renderToElement && !renderFunction) {
        throw `Cannot find root page element to render to with id '${rootPageElementId || defaultRootPageElementId}'`;
    }

    (renderFunction ?? render)(
        <Provider
            store={getStore()}>
            <ConnectedRouter
                history={history} >
                <AppContainer
                    lazyPageFallback={lazyPageFallback ?? defaultLazyPageFallback}
                    pageWrappers={_pageWrappers}
                    modules={allModules} />
            </ConnectedRouter>
        </Provider>,
        renderToElement
    );

    // Fire post first render
    getStore().dispatch(appSlice.actions.onPostFirstRender());

    return {
        history: history,
        getStore: getStore
    };
}
