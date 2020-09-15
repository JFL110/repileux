import appSlice, { persistenceVersionKey, persistenceTimeKey } from './appSlice'
import OpStatusCode from './opStatusCode'
import { getStore, onStoreLoad } from './globalStore';
import { connect } from 'react-redux'
import itemOrList from './itemOrList'
import isFunction from './isFunction';
import isPlainObject from './isPlainObject'

const singletonKey = "single";
const localStoragePrefix = "__opState-";

// TODO - auto expiration?
// TODO - max items

// Global state
var keyCounter = 0;
var stateRegister = {};

const now = () => new Date().getTime();

const defaultStateValue = {
    status: OpStatusCode.NOT_STARTED,
    value: null,
    args: null
};

// Mapping store state to the format consumed by components
const mapSingleStored = _s => {
    const s = _s ?? defaultStateValue;
    return {
        statusCode: s.status,
        value: s.value,
        args: s.args,
        error: s.error,
        calcStartTime: s.calcStartTime,
        calcEndTime: s.calcEndTime,
        isInProgress: () => s.status == OpStatusCode.IN_PROGRESS,
        wasError: () => s.status == OpStatusCode.ERRORED,
    }
};
const mapStored = isSingleton => values => isSingleton ? mapSingleStored(values[singletonKey]) : [...Object.values(values)].map(mapSingleStored);

// Error mapper
const rootMapError = err => {
    if (!err)
        return err;

    if (typeof err === "string" || typeof err === "boolean")
        return err;

    return isPlainObject(err) ? err : JSON.stringify(err);
}

/*!
 * OpState is state that is derived from an expensive operation, for example a web request. 
 */
export default ({
    name,
    // Only one item of this state will be stored
    isSingleton = true,
    // If true the current value will be nulled during calculation
    nullDuringCalculation = false,
    // If true additional calculation requests will be ignored if one is in progress for a given arguement set / singleton
    ignoreConcurrent = false,
    // If true, only one state item will be stored per argument. JSON.stringify used to key arguments
    keyByArguments = true,
    // If true, ignore the output of requests started before the last clear
    ignoreBeforeClear = false,
    // Initial value given to this state
    initialValue = null,
    // Log calculation errors,
    logCalculationErrors = true,
    // Local storage persistence
    persistInLocalStorage = false,
    persistErrors = false,
    persistenceVersion = 0,
    logPersistenceVersionChanges = true,
    // Retry
    isIdempotent = false,
    maxRetryCount = null,
    // Function to determine if a retry should be attempted. Takes {attemptNumber, error, args}. Used in conjunction with maxRetryCount if specified
    shouldRetry = null,
    // Either fixed value or function to determine number of ms to wait before retry, taking {attemptNumber, error, args}
    retryDelayMs = null,
    // On initial load, if the saved version is this old, don't load it
    persistenceExpirationMs = null,
    // 
    expirationMs = null,
    logExpirations = false,
    // The function that calculates the state. Must return a promise
    calculator,
    // Functions to apply to the calculator output
    postProcessors = [],
    // Watcher functions that are triggered when the state value is updated
    watchers = [],
    // Watcher functions that are triggered when the state value is cleared
    clearWatchers = [],
    // Errors
    errorMappers = [],
}) => {

    // Validate
    if (!name) throw "name is required for createOpState";
    if (!calculator) throw "calculator is required for createOpState";
    if (initialValue) throw "Not implemented";
    if (persistErrors && !persistInLocalStorage) throw "Cannot set persistErrors without persistInLocalStorage";
    if (persistenceExpirationMs && !persistInLocalStorage) throw "Cannot set persistenceExpirationMs without persistInLocalStorage";
    if (!isIdempotent && maxRetryCount > 0) throw "Cannot use maxRetryCount with non-idempotent calculations"
    if (!isIdempotent && shouldRetry) throw "Cannot use shouldRetry with non-idempotent calculations"
    if (!isIdempotent && retryDelayMs) throw "Cannot use retryDelayMs with non-idempotent calculations"
    if (!maxRetryCount && shouldRetry) throw "shouldRetry is specified but will never be called as maxRetryCount = 0"

    // Array correct
    const _watchers = itemOrList(watchers);
    const _postProcessors = itemOrList(postProcessors);
    const _clearWatchers = itemOrList(clearWatchers);
    const _errorMappers = itemOrList(errorMappers);

    // Local storage
    const localStorageKey = persistInLocalStorage ? localStoragePrefix + name : null;

    // Key
    const argsToKey = args => isSingleton ? singletonKey : (keyByArguments ? JSON.stringify(args) : keyCounter++);

    // Load from local storage if persisting
    var waitForInitialRead;
    if (persistInLocalStorage) {

        waitForInitialRead = onStoreLoad().then(store => {

            const storedValue = localStorage.getItem(localStorageKey);

            if (storedValue && storedValue !== 'undefined' && storedValue !== 'null') {
                try {
                    const parsed = JSON.parse(storedValue);
                    const savedVersion = parsed?.[persistenceVersionKey];
                    if (savedVersion != null && savedVersion == persistenceVersion) {

                        // Version is good
                        const savedTime = parsed[persistenceTimeKey];

                        // Take smallest of persistenceExpirationMs or expirationMs
                        const expireTime = (persistenceExpirationMs || expirationMs) &&
                            Math.min(persistenceExpirationMs ?? Number.MAX_VALUE, expirationMs ?? Number.MAX_VALUE);

                        // Check saved time
                        if (savedTime && !isNaN(savedTime) && (!expireTime || (now() - savedTime) <= expireTime)) {
                            // Update state from storage
                            store.dispatch(appSlice.actions.setOpStateFromStorage({
                                name: name,
                                value: parsed
                            }));
                        } else {
                            // Saved data is too old
                            logPersistenceVersionChanges && console.log(`Data for OpState ${name}, has expired, ignoring. Timestamp was ${savedTime}.`);
                            localStorage.removeItem(localStorageKey);
                        }
                    } else {
                        // Saved data is wrong version
                        logPersistenceVersionChanges && console.log(`Found old data for OpState ${name}, version ${savedVersion} expected ${persistenceVersion}, ignoring`);
                        localStorage.removeItem(localStorageKey);
                    }
                } catch (err) {
                    console.log(`Error reading from local storage for OpState ${name}, suppressing:`, err);
                }
            }
        }).then(() => true)
    } else {
        waitForInitialRead = Promise.resolve(true);
    }

    // Errors
    const mapError = err => {
        try {
            var current = err;
            _errorMappers.forEach(m => current = m(err));
            return rootMapError(current);
        } catch (err2) {
            console.error("Error while mapping errors, ignoring", err2);
            return null;
        }
    }

    // --- Read
    const _get = () => getStore().getState()[appSlice.name].opState[name] ?? {};
    const get = () => mapStored(isSingleton)(_get());

    // --- Modifications

    var lastClearTimeState = {
        all: null,
        items: {}
    };

    // Get the max of the last global clear or item clear time
    const lastClearTime = key => {
        const itemTime = lastClearTimeState.items[key];
        const allTime = lastClearTimeState.all;

        if (!itemTime && !allTime) return null;
        if (itemTime && !allTime) return itemTime
        if (allTime && !itemTime) return allTime
        return Math.max(itemTime, allTime);
    }
    const ignoreConcurrentPromiseHandle = {};

    // Updater
    const updater = (key, args) => ({
        status, value, error, calcStartTime, calcEndTime, clear
    }) => {
        // Update in the store
        getStore().dispatch(appSlice.actions.setOpStateItem({
            name: name,
            key: key,
            args: args,
            error: error && mapError(error),
            status: status,
            value: value,
            localStorageKey: localStorageKey,
            persistErrors: persistErrors,
            persistenceVersion: persistenceVersion,
            calcStartTime: calcStartTime,
            calcEndTime: calcEndTime,
            clear: clear
        }));
        // Trigger watchers - suppress any errors
        _watchers.forEach(watcher => {
            try {
                watcher(mapSingleStored({
                    ...{
                        status: status,
                        value: value,
                        args: args,
                        error: error,
                        calcStartTime: calcStartTime,
                        calcEndTime: calcEndTime,
                    },
                    getState: getStore().getState,
                    dispatch: getStore().dispatch
                }));
            }
            catch (err) {
                console.error(`Watcher error for opState ${name}, suppressing:`, err);
            }
        });
    }

    // Invoke the calculator to calculate the state
    var retryHandle;
    const calculate = (args, previousAttempts, delay) => {

        const key = argsToKey(args);

        // Ignore concurrent
        if (ignoreConcurrent &&
            getStore().getState()[appSlice.name].opState[name]?.[key]?.status == OpStatusCode.IN_PROGRESS) {

            if (!ignoreConcurrentPromiseHandle[key]) {
                throw "Lost the promise for an in-progress OpState";
            }

            return ignoreConcurrentPromiseHandle[key];
        }

        const update = updater(key, args);

        // Set status to in-progress
        update({
            status: OpStatusCode.IN_PROGRESS,
            // If nullDuringCalculation , null the value, otherwise use previous value
            value: !nullDuringCalculation ? (getStore().getState()[appSlice.name].opState[name]?.[key]?.value ?? null) : null
        })

        try {

            // Track calculation start time. If delaying, wait the delay and take start time from after the delay
            var promiseStart, calcTime;
            if (delay && delay > 0) {
                promiseStart = new Promise(resolve => setTimeout(resolve, delay))
                    .then(() => {
                        calcTime = now();
                        return Promise.resolve(calculator(args))
                    })
            } else {
                calcTime = now();
                promiseStart = calculator(args);
            }

            const promise = promiseStart
                .then(output => {

                    const clearTime = lastClearTime(key);
                    const calcEndTime = now();

                    if (ignoreBeforeClear && clearTime && clearTime > calcTime) {
                        // Ignore - calculation started before clear
                        return;
                    }

                    // Post process
                    var processedOutput = output;
                    _postProcessors.forEach(p => {
                        processedOutput = p(processedOutput);
                    });

                    // Done
                    update({
                        status: OpStatusCode.SUCCESS,
                        calcStartTime: calcTime,
                        calcEndTime: calcEndTime,
                        value: processedOutput,
                    });
                    return processedOutput;
                })
                .catch(err => {

                    const clearTime = lastClearTime(key);
                    const calcEndTime = now();

                    if (ignoreBeforeClear && clearTime && clearTime > calcTime) {
                        // Ignore - calculation started before clear
                        return;
                    }

                    update({
                        status: OpStatusCode.ERRORED,
                        value: null,
                        calcStartTime: calcTime,
                        calcEndTime: calcEndTime,
                        error: err
                    });
                    logCalculationErrors && console.error(`Error fetching OpState ${name} attempt ${previousAttempts} : `, err);

                    if (
                        // Account for maxRetryCount
                        (maxRetryCount && (previousAttempts < maxRetryCount)) &&
                        // Account for shouldRetry
                        (!shouldRetry ||
                            shouldRetry({
                                attemptNumber: previousAttempts,
                                error: err,
                                args: args
                            }))) {

                        // Calculate retry delay, if any
                        const delay = retryDelayMs ? (isFunction(retryDelayMs) ? retryDelayMs({
                            attemptNumber: previousAttempts,
                            error: err,
                            args: args
                        }) : retryDelayMs) : 0;

                        logCalculationErrors && console.error(`Retrying${delay ? ' after delay ' + delay + 'ms' : ''}...`);
                        return Promise.resolve(retryHandle(args, previousAttempts + 1, !isNaN(delay) && delay > 0 ? delay : 0));
                    }
                });

            // Keep track of this promise if going to ignore future requests
            if (ignoreConcurrent) {
                ignoreConcurrentPromiseHandle[key] = promise;
            }

            return promise;

        } catch (err) {
            console.error(`Execution error, not retrying`, err);
            update(OpStatusCode.ERRORED, null, err ? err : null);
        }
    }
    retryHandle = calculate;


    // Clear all state
    const clearAll = () => {
        lastClearTimeState.all = now();
        lastClearTimeState.items = {};

        getStore().dispatch(appSlice.actions.clearOpState({
            name: name,
            localStorageKey: localStorageKey,
        }));

        _clearWatchers.forEach(w => {
            try {
                w();
            } catch (err) {
                console.error(`Clear watcher error for opState ${name}, suppressing:`, err);
            }
        })
    }

    // Clear state item
    const clear = (args) => {

        if (!singletonKey && !keyByArguments) throw "Cannot clear by arguments - no argument based key is maintained"

        const key = argsToKey(args);
        lastClearTimeState.items[key] = now();

        updater(key, args)({
            status: OpStatusCode.NOT_STARTED,
            value: null,
            clear: true,
        });
    }

    // Check expiration time of an item - return true if the item was expired
    const _checkExpiration = key => {
        if (!expirationMs) return false;

        const expireTime = now();
        const value = _get()[key];

        if (value?.calcStartTime && (expireTime - value.calcStartTime > expirationMs)) {
            // Value expired - whipe it
            logExpirations && console.log(`Expiring state item for OpState ${name}.`)
            updater(key, null)({
                status: OpStatusCode.NOT_STARTED,
                value: null,
                clear: true,
            });

            return true;
        }

        return false;
    }

    // Check expiration time of all items - return true any item was expired
    const checkExpirations = () => {
        if (!expirationMs) return false;
        return ![...Object.keys(_get())].map(_checkExpiration).every(i => !i);
    };


    // 
    const calculateIfNeeded = args => {

        const key = argsToKey(args);

        // Expiration
        const didExpire = (!singletonKey && !keyByArguments) ? false : _checkExpiration(key);
        if (didExpire) return calculate(args, 0, 0);

        // Has value already
        const currentValue = _get()[key];
        const wasSuccess = currentValue?.status == OpStatusCode.SUCCESS;
        if (wasSuccess) return Promise.resolve(currentValue.value);

        // Calculate
        return calculate(args, 0, 0);
    }


    // Register
    stateRegister[name] = {
        isSingleton: isSingleton
    };

    return {
        name: name,
        initialValue: initialValue,
        isSingleton: isSingleton,
        get: get,
        calculate: args => calculate(args, 0, 0),
        calculateIfNeeded: calculateIfNeeded,
        clearAll: clearAll,
        clear: clear,
        checkExpirations: checkExpirations,
        waitForInitialRead: () => waitForInitialRead,
    }
}


export const connectToOpState = (namesOrStates, component) => {

    if (!namesOrStates) throw "One or more state names or states are required for connectToOpState";
    if (!component) throw "component is required for connectToOpState";

    return connect(state => {
        const values = {};
        itemOrList(namesOrStates).forEach(nameOrState => {
            const name = typeof nameOrState === "string" ? nameOrState : nameOrState.name;
            const isSingleton = typeof nameOrState === "string" ? (stateRegister[name]?.isSingleton ?? true) : nameOrState.isSingleton;
            const stateValue = state[appSlice.name].opState[name];
            return values[name] = mapStored(isSingleton)(stateValue ?? (isSingleton ? defaultStateValue : [defaultStateValue]));
        });
        return values;
    })(component);
}