import createOpState from "./createOpState"
import defaultNetOpStateFetcher from './defaultNetOpStateFetcher'
import itemOrList from "./itemOrList";

const typeErrorMapper = err => {
    return err instanceof TypeError ? String(err) : err;
}


/*!
 * OpState that is derrived from a web request
 * 
 * @param name Name of the state,
 */
const createNetOpState = ({
    name,
    endpoint = null,
    // Only one item of this state will be stored
    isSingleton = true,
    // If true the current value will be nulled during calculation
    nullDuringFetch = false,
    // If true additional fetch requests will be ignored if one is in progress for a given arguement set / singleton
    ignoreConcurrent = true,
    // If true, only one state item will be stored per argument. JSON.stringify used to key arguments
    keyByArguments = true,
    // If true, ignore the output of requests started before the last clear
    ignoreBeforeClear = true,
    // Initial value given to this state
    initialValue = null,
    // Log calculation errors,
    logErrors = true,
    // Local storage persistence
    persistInLocalStorage = false,
    persistErrors = false,
    persistenceVersion = 0,
    logPersistenceVersionChanges = true,
    // On initial load, if the saved version is this old, don't load it
    persistenceExpirationMs = null,
    // Errors
    errorMappers = [],
    // Put the value of the body in the stored value, throwing headers and status code away
    bodyOnly = true,
    //
    requestBodyTransformations = [],
    responseBodyTransformations = [],
    nullRequestBody = false,
    // Retry
    isIdempotent = false,
    maxRetryCount = null,
    // Function to determine if a retry should be attempted. Takes {attemptNumber, error, args}. Used in conjunction with maxRetryCount if specified
    shouldRetry = null,
    // Either fixed value or function to determine number of ms to wait before retry, taking {attemptNumber, error, args}
    retryDelayMs = null,
}) => {

    // Validate

    // Items -> Arrays
    const _errorMappers = itemOrList(errorMappers);
    const _requestBodyTransformations = itemOrList(requestBodyTransformations);
    const _responseBodyTransformations = itemOrList(responseBodyTransformations);

    // Null request body transformation
    if (nullRequestBody) {
        _requestBodyTransformations.push(() => null);
    }

    // OpState Calculator
    const calculator = (args) => {
        return defaultNetOpStateFetcher({
            endpoint: endpoint,
            body: args,
            requestBodyTransformations: _requestBodyTransformations,
        }).then(resp => {
            if (!resp) return;

            // Error handling
            if (resp.statusCode != 200) {
                console.log(resp);
                throw resp;
            }

            // Body transformations
            var bodyTransformed = resp.body;
            _responseBodyTransformations.forEach(t => bodyTransformed = t(bodyTransformed));

            const respTransformed = {
                ...resp,
                body: bodyTransformed
            }

            if (bodyOnly) {
                return respTransformed.body;
            }

            return respTransformed;
        })
    }

    const fullErrorMappers = [..._errorMappers, typeErrorMapper];

    return createOpState({
        name: name,
        isSingleton: isSingleton,
        ignoreConcurrent: ignoreConcurrent,
        nullDuringCalculation: nullDuringFetch,
        ignoreBeforeClear: ignoreBeforeClear,
        keyByArguments: keyByArguments,
        initialValue: initialValue,
        logCalculationErrors: logErrors,
        persistInLocalStorage: persistInLocalStorage,
        persistErrors: persistErrors,
        persistenceVersion: persistenceVersion,
        persistenceExpirationMs: persistenceExpirationMs,
        logPersistenceVersionChanges: logPersistenceVersionChanges,
        calculator: calculator,
        errorMappers: fullErrorMappers,
        isIdempotent: isIdempotent,
        maxRetryCount: maxRetryCount,
        shouldRetry: shouldRetry,
        retryDelayMs: retryDelayMs,
    });
}

export default createNetOpState;