const auth = require("../auth");
const projectManager = require("../projectManager");
const logger = require("../logger");
const constants = require("./serverConstants");

/**
 * Factory function to generate the createProject callback
 * @param {object} client - the socketIO client object
 * @param {serverContext} serverContext - server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const credentials = data.credentials;
        const projectName = data.projectName;

        auth
            .authenticate(credentials.username, credentials.password)
            .then(hasAccess => {
                if (!hasAccess) {
                    return { status: constants.status.ACCESS_DENIED };
                } else {
                    return projectManager
                        .createProject({ name: projectName })
                        .then(() => projectManager.getProject(projectName))
                        .then(project =>
                            auth
                                .setAccess(
                                    credentials.username,
                                    project.id,
                                    auth.accessLevels.ADMIN
                                )
                                .then(() => {
                                    return {
                                        status: constants.status.OKAY,
                                        project: project
                                    };
                                })
                        );
                }
            })
            .then(callbackValue => callback(callbackValue))
            .catch(err => {
                if (
                    err.message ===
                    "SQLITE_CONSTRAINT: UNIQUE constraint failed: project.name"
                ) {
                    callback({ status: constants.status.EEXIST });
                } else {
                    logger.error(err);
                    callback({ status: constants.status.OKAY });
                }
            });
    };
};
