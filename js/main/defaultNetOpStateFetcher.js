import { valueOrCallWithArg } from './valueOrCall'

export default ({
    endpoint,
    body,
    requestBodyTransformations
}) => {

    if (!endpoint) throw "endpoint is required";
    if (!endpoint.method) throw "endpoint.method is required";
    if (!endpoint.uri) throw "endpoint.uri is required";

    var fetchBody = body;
    requestBodyTransformations.forEach(t => { fetchBody = t(fetchBody); });

    const opts = {
        method: endpoint.method,
        mode: endpoint.mode ? valueOrCallWithArg(endpoint.mode, body) : undefined,
        body: fetchBody == null ? null : JSON.stringify(fetchBody),
        headers: endpoint.headers ? valueOrCallWithArg(endpoint.headers, body) : {}
    }

    const uri = valueOrCallWithArg(endpoint.uri, body);

    return fetch(uri, opts)
        .then(resp => {
            if (resp == null)
                return;

            // Read all headers
            const headers = {};
            for (var pair of resp.headers.entries()) {
                headers[pair[0]?.toLocaleLowerCase()] = pair[1];
            }

            const contentType = headers['content-type'];
            const isJson = contentType && contentType.indexOf("application/json") !== -1;

            // TODO Blob handling

            return (isJson ? resp.json() : resp.text()).then(body => ({
                headers: headers,
                body: body,
                bodyIsParsedJson: isJson,
                statusCode: resp.status
            }));
        });
}