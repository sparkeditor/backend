/**
 * Syncs files to every connected client
 * @param {object} io - The socketIO server object
 * @param {serverContext} serverContext - Server state object
 */
module.exports = function(io, serverContext) {
    for (let filePath in serverContext.files) {
        if (!serverContext.files.hasOwnProperty(filePath)) {
            continue;
        }
        const file = serverContext.files[filePath];
        for (let clientId in file.clients) {
            if (!file.clients.hasOwnProperty(clientId)) {
                continue;
            }
            const client = io.sockets.connected[clientId];
            if (client) {
                client.emit('sync', {file: filePath, content: serverContext.getFileContents(filePath)});
            }
        }
    }
};