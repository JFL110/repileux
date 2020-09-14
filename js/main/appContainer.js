import React, { lazy, Suspense } from 'react'
import DocumentMeta from 'react-document-meta';
import { Route, Switch } from 'react-router'
import valurOrCall from './valueOrCall'
const noIdKeyPrefix = "__noIdKey";

export default ({
    modules,
    pageWrappers,
    lazyPageFallback }) => {

    var noIdKey = 0;

    const pageToRoute = (p, m) => {

        // Validate
        if (!p.path && !p.is404) throw `Invalid page for ${p} null path`
        if (!p.component) throw `Invalid page for ${p} null component`
        return <Route exact={!p.is404} path={p.is404 ? undefined : m.combinedPath(p)} key={p.id ?? (noIdKeyPrefix + noIdKey++)}>
            {p.meta && <DocumentMeta {...valurOrCall(p.meta)} extend />}
            {wrapPage(pageToComponent(p), p.additions)}
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
            modules.flatMap(m => {
                return m.pages.map(p => pageToRoute(p, m));
            })
        }
        {
            // 404 Pages -> Routes
            modules.sort((m1, m2) => (m1.urlPrefix?.length ?? 0) - (m2.urlPrefix?.length ?? 0))
                .flatMap(m => {
                    return m.fourOFourPages.map(p => pageToRoute(p, m));
                })
        }
    </Switch>
};