const projectManager = require("../projectManager");
const auth = require("../auth");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the authorization callback
 * @param {object} client - the current socket.io client
 * @param {serverContext} serverContext - the server context object
 * @returns {Function} - the callback for the 'authorize' event
 */
module.exports = function(client, serverContext) {
    return function (data, callback) {
        const credentials = data.credentials;
        auth.authenticate(credentials.username, credentials.password)
            .then((hasAccess) => {
                if (!hasAccess) {
                    return {status: constants.status.ACCESS_DENIED};
                }
                else {
                    return projectManager.getProjectsForUser(credentials.username).then((projects) => {
                        serverContext.mapIdToUsername(client.id, credentials.username);
                        return {status: constants.status.OKAY, projects: projects};
                    });
                }
            })
            .then((callbackValue) => callback(callbackValue))
            .catch((err) => {
                if (err.code === "DOES_NOT_EXIST") {
                    callback({status: constants.status.ACCESS_DENIED});
                }
                else {
                    logger.error(err);
                    callback({status: constants.status.ERROR});
                }
            });
    };
};