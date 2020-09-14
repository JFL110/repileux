import { _clearStoreInTest } from '../globalStore'
import { dispatchPush } from '../index'
beforeEach(() => {
    // Navigate back to home page if not from previous test
    try {
        dispatchPush("./");
    } catch (err) {/*suppress*/ }

    // Clear global store
    _clearStoreInTest();

    // Create root document element
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    expect(rootElement).not.toBeNull();
    document.documentElement.innerHTML = "";
    document.documentElement.appendChild(rootElement);

    window.location.href = "http://localhost/";
})