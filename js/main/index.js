import { push } from 'connected-react-router'
import { connect as _connect } from 'react-redux'
import { createSlice as _createSlice } from '@reduxjs/toolkit'
import { getStore } from './globalStore'
import _createApp from './createApp'
import _createPage from './createPage'
import _createModule from './createModule'
import _createOpState, { connectToOpState as _connectToOpState } from './createOpState'
import _createNetOpState from './createNetOpState'
import _createEndpoint from './createEndpoint'

import _connectWithSlice from './connectWithSlice'

export const dispatchPush = (to) => {
    getStore().dispatch(push(to));
};

export default _createApp;
export const createPage = _createPage;
export const createModule = _createModule;
export const connectToOpState = _connectToOpState;
export const createOpState = _createOpState;
export const connectWithSlice = _connectWithSlice;
export const connect = _connect;
export const createSlice = _createSlice;
export const createNetOpState = _createNetOpState;
export const createEndpoint = _createEndpoint;