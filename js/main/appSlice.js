import { createSlice } from '@reduxjs/toolkit';
import OpStatusCode from './opStatusCode';

// persistence
export const persistenceVersionKey = "__pVersion";
export const persistenceTimeKey = "__persistenceTime";

const filterOutInProgress = (state, persistErrors) => {
  if (!state) {
    return state;
  }

  return (Object.entries(state).reduce((obj, [key, value]) => {
    if (
      // If not inprogress
      value?.status != OpStatusCode.IN_PROGRESS &&
      // ... not error if not persisting errors
      (persistErrors || value?.status != OpStatusCode.ERRORED)) {
      obj[key] = value;
    }
    return obj;
  }, {}));
}

export default createSlice({
  name: 'app',
  initialState: {
    pagesVisited: {},
    opState: {}
  },
  reducers: {
    // Render events
    onPreFirstRender: state => state,
    onPostFirstRender: state => state,

    // OpState - set everything
    setOpStateFromStorage: (state, { payload }) => {
      state.opState[payload.name] = payload.value;
    },
    setOpStateItem: (state, { payload }) => {

      // Initalise the container
      if (!state.opState[payload.name]) {
        state.opState[payload.name] = {};
      }

      if (payload.clear) {
        // Remove the item
        delete state.opState[payload.name][payload.key];
      } else {
        // Set the item
        state.opState[payload.name][payload.key] = {
          status: payload.status,
          value: payload.value,
          args: payload.args,
          error: payload.error,
          calcStartTime: payload.calcStartTime,
          calcEndTime: payload.calcEndTime,
        }
      }

      // Local storage
      if (payload.localStorageKey) {
        try {
          localStorage.setItem(payload.localStorageKey,
            JSON.stringify({
              ...filterOutInProgress(state.opState[payload.name], payload.persistErrors),
              [persistenceVersionKey]: payload.persistenceVersion,
              [persistenceTimeKey]: new Date().getTime(),
            }));
        } catch (err) {
          console.log(`Error saving to local storage for OpState ${payload.name}, suppressing:`, err);
        }
      }
    },
    clearOpState: (state, { payload }) => {
      state.opState[payload.name] = {};
      if (payload.localStorageKey) {
        try {
          localStorage.removeItem(payload.localStorageKey);
        } catch (err) {
          console.log(`Error removing item from local storage for OpState ${payload.name}, suppressing:`, err);
        }
      }
    },

    setPageVisited: (state, action) => { state.pagesVisited[action.payload] = true; },
  }
});
