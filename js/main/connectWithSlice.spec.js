import createApp, { connectWithSlice } from './index'
import { createSlice } from '@reduxjs/toolkit'

test('', () => {

    const testSlice = createSlice({
        name: 'test-slice',
        initialState: {
            value: null
        },
        reducers: {}
    });

    connectWithSlice(testSlice, ({ value }) => {
        return <div>{value}</div>
    });

    createApp({});
})