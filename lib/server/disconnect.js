/**
 * Factory function to generate the disconnect callback
 * @param {object} client - the socketIO client object
 * @param {serverContext} serverContext - server state object
 * @returns {function}
 */
module.exports = function(client, serverContext) {
  return function() {
    serverContext.getFilesForClient(client.id).forEach(function(file) {
      serverContext.removeClient(file, client.id);
      client.broadcast.emit("close", {
        file: file,
        username: serverContext.getUsername(client.id)
      });
    });
  };
};
