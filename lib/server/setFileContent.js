const Promise = require("bluebird");
const auth = require("../auth");
const projectManager = require("../projectManager");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the socketIO setFileContents callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const file = data.file;
        const content = data.content;
        const credentials = data.credentials;
        projectManager
            .getProjectForFile(file)
            .then(projectId => {
                if (!projectId) {
                    return false;
                } else {
                    return [
                        auth.authenticate(
                            credentials.username,
                            credentials.password,
                            projectId
                        ),
                        auth.getAccess(credentials.username, projectId)
                    ];
                }
            })
            .spread((hasAccess, accessLevel) => {
                if (!hasAccess) {
                    return false;
                } else {
                    return (
                        accessLevel === auth.accessLevels.CONTRIBUTOR ||
                        accessLevel === auth.accessLevels.ADMIN
                    );
                }
            })
            .then(hasAccess => {
                if (!hasAccess) {
                    return { status: constants.status.ACCESS_DENIED };
                } else {
                    serverContext.setFileContent(file, content, client.id);
                    client.broadcast.emit("setFileContent", {
                        file: file,
                        content: content
                    });
                    return { status: constants.status.OKAY };
                }
            })
            .then(callbackValue => callback(callbackValue))
            .catch(err => {
                logger.error(err);
                callback({ status: constants.status.ERROR });
            });
    };
};
