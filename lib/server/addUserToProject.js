const constants = require("./serverConstants");
const projectManager = require("../projectManager");
const auth = require("../auth");
const logger = require("../logger");

/**
 * Factory function to generate the socketIO addUserToProject callback
 * @param {object} client - The socketIO client object
 * @param {serverContext} serverContext - Server state object
 * @returns {Function}
 */
module.exports = function(client, serverContext) {
    return function(data, callback) {
        const credentials = data.credentials;
        const username = data.username;
        const projectId = data.projectId;

        Promise.all([
            auth.authenticate(
                credentials.username,
                credentials.password,
                projectId
            ),
            auth.getAccess(credentials.username, projectId)
        ])
            .spread((hasAccess, accessLevel) => {
                if (!hasAccess) {
                    return false;
                } else {
                    return accessLevel === auth.accessLevels.ADMIN;
                }
            })
            .then(hasAccess => {
                if (!hasAccess) {
                    return { status: constants.status.ACCESS_DENIED };
                } else {
                    return projectManager
                        .getUsersForProject(projectId)
                        .then(users => {
                            let userInProject = false;
                            users.forEach(user => {
                                if (user.username === username) {
                                    userInProject = true;
                                }
                            });
                            if (userInProject) {
                                return { status: constants.status.OKAY };
                            } else {
                                return auth
                                    .setAccess(
                                        username,
                                        projectId,
                                        auth.accessLevels.CONTRIBUTOR
                                    )
                                    .then(() => {
                                        return {
                                            status: constants.status.OKAY
                                        };
                                    });
                            }
                        });
                }
            })
            .then(callbackValue => callback(callbackValue))
            .catch(err => {
                logger.error(err);
                callback({ status: constants.status.ERROR });
            });
    };
};
