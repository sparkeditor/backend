/**
 * Factory function to generate the close callback
 * @param {object} client - the socketIO client object
 * @param {object} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
   return function(data, callback) {
       const file = data.file;
       if (serverContext.clients[client.id].indexOf(file) != -1) {
           serverContext.clients[client.id] = serverContext.clients[client.id].filter(function(filename) { return filename === file });
           // Is this client the last one to have that file open?
           let lastClient = true;
           for (const clientId in serverContext.clients) {
               if (!serverContext.clients.hasOwnProperty(clientId)) {
                   continue;
               }
               const fileList = serverContext.clients[clientId];
               if (fileList.indexOf(file) != -1) {
                   lastClient = false;
                   break;
               }
           }
           if (lastClient) {
               // No more clients need this buffer; we can safely close it
               delete serverContext.buffers[file];
           }
       }
   }
};