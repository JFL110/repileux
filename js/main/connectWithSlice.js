import { connect } from 'react-redux'

/**
 * Connect a component with *all* of the reducers and actions in a slice
 */
export default (slice, component) => {
    return connect(
        state => ({
            ...state[slice.name]
        }),
        { ...slice.actions })(component);
}
