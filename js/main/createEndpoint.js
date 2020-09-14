export default ({
    name = null,
    uri = null,
    mode = null,
    method = 'GET',
}) => {
    return {
        name: name,
        uri: uri,
        mode: mode,
        method: method
    }
}