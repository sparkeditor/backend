const auth = require("../auth");
const projectManager = require("../projectManager");
const constants = require("./serverConstants");
const fileIO = require("../fileIO");
const logger = require("../logger");

/**
 * Factory function to generate the socketIO write callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const file = data.file;
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
                    fileIO
                        .write(file, serverContext.getFileContents(file))
                        .then(() => {
                            client.broadcast.emit("write", { file: file });
                            callback({ status: constants.status.OKAY });
                        })
                        .catch(err => {
                            logger.error(err);
                            callback({ status: constants.status.ERROR });
                        });
                }
            });
    };
};
