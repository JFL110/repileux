import { matchPath } from 'react-router'
import appSlice from './appSlice'

const _reactRouterNavActionType = "@@router/LOCATION_CHANGE";

/**
 * Middleware that:
 * -  triggers a page onLoad event when it's navigated to
 */
export default modules => ({ getState, dispatch }) => next => action => {

    if (action.type != _reactRouterNavActionType) {
        next(action);
        return;
    }

    const pathName = action.type == _reactRouterNavActionType ? action.payload.location.pathname : getState().router.location.pathname;

    // Evaluate all page matches to find exact match
    var matchPage = modules.flatMap(m => m.pages.map(page => ({
        page: page,
        match: matchPath(pathName, { path: m.combinedPath(page) })
    }))).find(e => e.match && e.match.isExact);

    // If none, it's a 404 page
    if (!matchPage) {
        matchPage = modules.sort((m1, m2) => (m1.urlPrefix?.length ?? 0) - (m2.urlPrefix?.length ?? 0))
            .flatMap(m => m.fourOFourPages.map(page => ({
                page: page,
                match: matchPath(pathName, { path: m.combinedPath(page) })
            }))).find(e => e.match && e.page.is404);
    }

    if (matchPage?.page) {

        const args = {
            match: matchPage.match,
            dispatch: dispatch,
            getState: getState
        };

        next(action);

        if (!getState()[appSlice.name].pagesVisited[matchPage.page.id]) {
            // On first load
            matchPage.page.onFirstLoad?.(args);
            dispatch(appSlice.actions.setPageVisited(matchPage.page.id));
        }

        // On load
        matchPage.page.onLoad?.(args);

        return;
    }

    next(action);
};