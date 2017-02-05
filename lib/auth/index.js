const bcrypt = require("bcrypt");
const database = require("../database");

/** The number of salt rounds to use when hashing passwords */
const SALT_ROUNDS = 12;

/**
 * Generates a "user does not exist" error
 * @param {string} username
 * @returns {Error}
 */
const doesNotExistError = function(username) {
   const error = new Error("User " + username + " does not exist");
   error.code = "DOES_NOT_EXIST";
   return error;
};
/**
 * This module exposes an API to add, remove, and authenticate users.
 * Users are given permission to access certain projects.
 */
module.exports = {
    /**
     * Access levels represent a user's permissions for a project
     *
     * One of "ADMIN", "CONTRIBUTOR", "READ_ONLY"
     * @enum {string} accessLevels
     * @typedef {string} accessLevel
     */
    accessLevels: {
        /** Administrator level access - full permissions */
        ADMIN: "ADMIN",
        /** Contributor level access - can read/write files */
        CONTRIBUTOR: "CONTRIBUTOR",
        /** Read-only level access - can view project files but make no changes */
        READ_ONLY: "READ_ONLY"
    },
    /**
     * Represents a linking between a project and an access level, for
     * use when adding a user
     * @typedef {object.<number, accessLevel>} projectAccessLevel - The key is the project id and the value is the access level
     */
    /**
     * The user model
     * @typedef {object} user
     * @property {number} [id]
     * @property {string} username
     * @property {string} password
     * @property {object.<number, accessLevel>[]} [projects] -
     *     If present in an addUser() call, this defines the projects
     *     that the user can access and their access levels
     */
    /**
     * Adds a new user to the DB
     * @param {user} userDefinition
     * @return {Promise}
     */
    addUser: function(userDefinition) {
        return bcrypt.hash(userDefinition.password, SALT_ROUNDS)
            .then((hash) => {
                return {
                    username: userDefinition.username,
                    password: hash
                };
            })
            .then((user) => {
                return database.insertInto("user", user);
            })
            .then(() => {
                if (userDefinition.projects) {
                    return database.query("user", {username: userDefinition.username})
                        .then((rows) => {
                            const userModel = rows[0];
                            const projects = [];
                            userDefinition.projects.forEach(function(projectAccessLevel) {
                                const projectId = Object.keys(projectAccessLevel)[0];
                                const accessLevel = projectAccessLevel[projectId];
                                projects.push({
                                    user_id: userModel.id,
                                    project_id: projectId,
                                    access_level: accessLevel
                                });
                            });
                            return database.insertInto("user_project", projects)
                        });
                }
            });
    },
    /**
     * Deletes a user from the DB
     * @param {string} username - The username of the user to delete
     * @returns {Promise}
     */
    removeUser: function(username) {
        return database.query("user", {username: username})
            .then((rows) => {
                const user = rows[0];
                if (!user) {
                    throw doesNotExistError(username);
                }
                return database.deleteRow("user", {username: username})
                    .then(() => {
                        return database.deleteRow("user_project", {user_id: user.id});
                    });
            });
    },
    /**
     * Gives a user access to a project, or changes his/her existing access level
     * @param {string} username
     * @param {number} projectId
     * @param {accessLevel} accessLevel
     * @returns {Promise}
     */
    setAccess: function(username, projectId, accessLevel) {
        return database.query("user", {username: username})
            .then((rows) => {
                const user = rows[0];
                if (!user) {
                    throw doesNotExistError(username);
                }
                return database.deleteRow("user_project", {user_id: user.id, project_id: projectId})
                    .then(() => {
                        return database.insertInto("user_project", {user_id: user.id, project_id: projectId, access_level: accessLevel});
                    });
            });
    },
    /**
     * Gets the access level for the given user and project
     * @param {string} username
     * @param {number} projectId
     * @returns {Promise}
     */
    getAccess: function(username, projectId) {
        return database.query({"user": "id", "user_project": "user_id"}, {username: username, project_id: projectId})
            .then((rows) => {
                if (rows.length === 0) {
                    throw new Error(username + " does not have access to project id " + projectId);
                }
                return rows[0].access_level;
            });
    },
    /**
     * Removes a user's access to a project
     * @param {string} username
     * @param {number} projectId
     * returns {Promise}
     */
    revokeAccess: function(username, projectId) {
        return database.query("user", {username: username})
            .then((rows) => {
                const user = rows[0];
                if (!user) {
                    throw doesNotExistError(username);
                }
                return database.deleteRow("user_project", {user_id: user.id, project_id: projectId});
            });
    },
    /**
     * Authenticates a user (optionally, to a project)
     * @param {string} username - The user's username
     * @param {string} password - The user's password (plaintext)
     * @param {number} [projectId] - The project's id, if applicable
     * @returns {Promise} - Resolves with a boolean hasAccess or an error
     */
    authenticate: function(username, password, projectId) {
        return database.query("user", {username: username})
            .then((rows) => {
                const user = rows[0];
                if (!user) {
                    throw doesNotExistError(username);
                }
                return bcrypt.compare(password, user.password)
                    .then((matches) => {
                        if (matches && projectId) {
                            return database.query("user_project", {user_id: user.id, project_id: projectId})
                                .then((rows) => {
                                    return (rows.length !== 0);
                                })
                        }
                        else {
                            return matches;
                        }
                    });

            });
    }
};