const projectManager = require("../projectManager");
const auth = require("../auth");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the authorization callback
 * @param {object} client - the current socket.io client
 * @param {object} serverContext - the server context object
 * @returns {Function} - the callback for the 'authorize' event
 */
module.exports = function(client, serverContext) {
    return function (data, callback) {
        const credentials = data.credentials;
        auth.authenticate(credentials.username, credentials.password, function (err, hasAccess) {
            if (err) {
                logger.error(err);
                callback({status: constants.status.ERROR})
            }
            else if (!hasAccess) {
                callback({status: constants.status.ACCESS_DENIED});
            }
            else {
                // Keep track of connected clients and their open buffers
                serverContext.clients[client.id] = [];
                projectManager.getProjectsForUser(credentials.username, function (err, projects) {
                    if (err) {
                        logger.error(err);
                    }
                    else {
                        callback({
                            status: constants.status.OKAY,
                            projects: projects
                        });
                    }
                });
            }
        });
    };
};