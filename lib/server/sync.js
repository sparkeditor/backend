/**
 * Syncs files to every connected client
 * @param {object} io - The socketIO server object
 * @param {serverContext} serverContext - Server state object
 */
module.exports = function(io, serverContext) {
    for (clientId in io.sockets.connected) {
        if (!io.sockets.connected.hasOwnProperty(clientId)) {
            continue;
        }
        // Handle case where client is connected but not authenticated
        if (!serverContext.clients[clientId]) {
            continue;
        }
        const client = io.sockets.connected[clientId];
        const files = {};
        for (let file in serverContext.clients[clientId]) {
            if (!serverContext.clients[clientId].hasOwnProperty(file)) {
                continue;
            }
            files[file] = serverContext.buffers[file];
        }
        client.emit('sync', {files: files});
    }
};