
/*!
 * Return true if the supplied argument is a function, otherwise false
 */
export default functionToCheck => {
    return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}