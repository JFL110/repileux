import React, { lazy, Suspense } from 'react'
import DocumentMeta from 'react-document-meta';
import { Route, Switch } from 'react-router'
import valurOrCall from './valueOrCall'
const noIdKeyPrefix = "__noIdKey";

export default ({
    allPaths,
    pageWrappers,
    lazyPageFallback }) => {

    var noIdKey = 0;

    const pageToRoute = ({ path, page }, as404) => {
        // Validate
        if (!path && !page.is404) throw `Invalid page for ${page} null path`
        if (!page.component) throw `Invalid page for ${page} null component`
        return <Route exact={!as404} path={path} key={page.id ?? (noIdKeyPrefix + noIdKey++)}>
            {page.meta && <DocumentMeta {...valurOrCall(page.meta)} extend />}
            {wrapPage(pageToComponent(page), page.additions)}
        </Route>
    }

    const wrapPage = (p, additions) => {
        var component = p;
        pageWrappers.forEach(pageWrapper => component = pageWrapper(component, additions));
        return component;
    }

    const pageToComponent = p => {
        if (p.lazyWrap) {
            const Wrapped = lazy(p.component);
            return <Suspense fallback={valurOrCall(lazyPageFallback)}>
                <Wrapped />
            </Suspense>
        } else {
            return valurOrCall(p.component)
        }
    }

    return <Switch>
        {
            // Pages -> Routes
            allPaths.pages.map(pathAndPage => pageToRoute(pathAndPage, false))
        }
        {
            // 404 Pages -> Routes
            allPaths.fourOFourPages.map(pathAndPage => pageToRoute(pathAndPage, true))
        }
    </Switch>
};