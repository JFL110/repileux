
var theGlobalStore = null;
var storeLoadResolves = [];

export function setStore(store) {
  if (theGlobalStore) {
    throw "Attempt to overwrite the global store. ";
  }
  theGlobalStore = store;
  storeLoadResolves.forEach(r => r(theGlobalStore));
  storeLoadResolves = null;
}

export function getStore() {
  if (!theGlobalStore) {
    throw "Attempt to get store before it has been set.";
  }
  return theGlobalStore;
}

export function onStoreLoad() {
  if (theGlobalStore) return new Promise(resolve => resolve(theGlobalStore));

  var resolve;
  const promise = new Promise(r => { resolve = r });
  storeLoadResolves.push(resolve);
  return promise;
}

export function _clearStoreInTest() {
  theGlobalStore = null;
  storeLoadResolves = [];
}