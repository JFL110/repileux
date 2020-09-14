import isFunction from './isFunction'

export default value => isFunction(value) ? value() : value
export const valueOrCallWithArg = (value, args) => isFunction(value) ? value(args) : value