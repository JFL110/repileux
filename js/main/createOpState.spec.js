import createApp, { createOpState } from './index'
import OpStatusCode from './opStatusCode'
import './__test__/jest-before-each.js'

beforeEach(() => {
    const store = createApp({}).getStore();
    expect(store).not.toBeNull();
})


it("loading from local storage", async () => {

    const localStorageKey = "__opState-state-four";

    // Insert into local storage
    const savedData = { "__pVersion": 1, "__persistenceTime": 1599927640653, "single": { "status": "success", "value": 100, "args": 22 } };
    localStorage.setItem(localStorageKey, JSON.stringify(savedData));

    const state = createOpState({
        name: "state-four",
        isSingleton: true,
        persistenceVersion: 1,
        persistInLocalStorage: true,
        calculator: () => new Promise(resolve => setTimeout(resolve, 2)).then(() => 5)
    })

    await state.waitForInitialRead();

    // Verify stored value
    expect(state.get().args).toBe(22);
    expect(state.get().statusCode).toBe(OpStatusCode.SUCCESS);
    expect(state.get().isInProgress()).toBeFalsy();
    expect(state.get().error).toBeUndefined()
    expect(state.get().value).toBe(100);

    // Overwrite
    await state.calculate(10);

    // Verify recalculated value
    expect(state.get().args).toBe(10);
    expect(state.get().statusCode).toBe(OpStatusCode.SUCCESS);
    expect(state.get().isInProgress()).toBeFalsy();
    expect(state.get().error).toBeUndefined()
    expect(state.get().value).toBe(5);

    // Fetch from localStorage
    const reSavedData = JSON.parse(localStorage.getItem(localStorageKey));

    // Verify saved data
    expect(reSavedData.__pVersion).toBe(1);
    expect(new Date().getTime() - reSavedData.__persistenceTime).toBeLessThan(500);
    expect(reSavedData.single.value).toBe(5);
    expect(reSavedData.single.args).toBe(10);
    expect(reSavedData.single.status).toBe(OpStatusCode.SUCCESS);

    // Clear
    state.clearAll();

    const clearedStoredData = localStorage.getItem(localStorageKey);
    expect(clearedStoredData).toBeNull();
})


it("erroring state", async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });     // Disable error logging

    const calculator = jest.fn(() => new Promise(resolve => setTimeout(resolve, 2)).then(() => { throw "I am throwing" }));
    const mockShouldRetry = jest.fn(() => true);

    // Create state
    const state = createOpState({
        name: "state-two",
        isSingleton: true,
        isIdempotent: true,
        persistInLocalStorage: true,
        ignoreBeforeClear: true,
        shouldRetry: mockShouldRetry,
        maxRetryCount: 5,
        retryDelayMs: 5,
        calculator: calculator
    })

    // Calculate
    const calculatedValue = await state.calculate(10);

    // Verify number of retries
    expect(calculator).toBeCalledTimes(6);

    // Verify calculate value
    expect(calculatedValue).toBeUndefined();
    expect(state.get().args).toBe(10);
    expect(state.get().statusCode).toBe(OpStatusCode.ERRORED);
    expect(state.get().isInProgress()).toBeFalsy();
    expect(state.get().error).toBe("I am throwing");
    expect(state.get().value).toBeNull();
})


it("erroring state - should not retry", async () => {
    jest.spyOn(console, 'error').mockImplementation(() => { });     // Disable error logging

    const mockShouldRetry = jest.fn(() => false);
    const calculator = jest.fn(() => new Promise(resolve => setTimeout(resolve, 2)).then(() => { throw "I am throwing" }));

    // Create state
    const state = createOpState({
        name: "state-three",
        persistInLocalStorage: true,
        shouldRetry: mockShouldRetry,
        isIdempotent: true,
        maxRetryCount: 5,
        retryDelayMs: 5,
        calculator: calculator
    })

    await state.calculate(10);

    // Verify number of retries
    expect(calculator).toBeCalledTimes(1);

    // Verify calculate value
    expect(state.get().args).toBe(10);
    expect(state.get().statusCode).toBe(OpStatusCode.ERRORED);
    expect(state.get().isInProgress()).toBeFalsy();
    expect(state.get().error).toBe("I am throwing");
    expect(state.get().value).toBeNull();
});


it("simple valid state", async () => {
    const mockWatcher = jest.fn(() => { });
    const mockClearWatchers = jest.fn(() => { });
    const mockPostProcessor = jest.fn(x => x + 2);

    // Create state
    const state = createOpState({
        name: "state-one",
        isSingleton: true,
        isIdempotent: true,
        watchers: mockWatcher,
        postProcessors: mockPostProcessor,
        clearWatchers: mockClearWatchers,
        persistInLocalStorage: true,
        ignoreBeforeClear: true,
        calculator: x => new Promise(resolve => setTimeout(resolve, 10)).then(() => x + 3)
    })

    // Verify props
    expect(state.name).toBe("state-one");
    expect(state.isSingleton).toBeTruthy();

    // Calculate
    const calculatedValue = await state.calculate(5);

    // Verify calculate value
    expect(calculatedValue).toBe(10);
    expect(state.get().args).toBe(5);
    expect(state.get().statusCode).toBe(OpStatusCode.SUCCESS);
    expect(state.get().isInProgress()).toBeFalsy();
    expect(state.get().error).toBeUndefined();
    expect(state.get().value).toBe(10);

    // Verify post processor
    expect(mockPostProcessor).toHaveBeenCalledTimes(1);
    expect(mockPostProcessor).toHaveBeenCalledWith(8);

    // Verify watcher calls

    expect(mockWatcher).toHaveBeenCalledTimes(2); // Once for move to in-progress, once for success
    expect(mockWatcher.mock.calls[0][0].args).toBe(5);
    expect(mockWatcher.mock.calls[0][0].isInProgress()).toBeTruthy();
    expect(mockWatcher.mock.calls[0][0].error).toBeUndefined();
    expect(mockWatcher.mock.calls[0][0].value).toBeNull();
    expect(mockWatcher.mock.calls[0][0].statusCode).toBe(OpStatusCode.IN_PROGRESS);

    expect(mockWatcher.mock.calls[1][0].args).toBe(5);
    expect(mockWatcher.mock.calls[1][0].isInProgress()).toBeFalsy();
    expect(mockWatcher.mock.calls[1][0].error).toBeUndefined();
    expect(mockWatcher.mock.calls[1][0].value).toBe(10);
    expect(mockWatcher.mock.calls[1][0].statusCode).toBe(OpStatusCode.SUCCESS);

    expect(mockClearWatchers).toHaveBeenCalledTimes(0);

    // Clear
    state.clearAll();

    expect(mockClearWatchers).toHaveBeenCalledTimes(1);
    expect(state.get().args).toBeNull();
    expect(state.get().statusCode).toBe(OpStatusCode.NOT_STARTED);
    expect(state.get().isInProgress()).toBeFalsy();
    expect(state.get().error).toBeUndefined();
    expect(state.get().value).toBeNull();
})