const bcrypt = require("bcrypt");
const database = require("../database");

/** The number of salt rounds to use when hashing passwords */
const SALT_ROUNDS = 12;

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
     * @property {number} id
     * @property {string} username
     * @property {string} password
     * @property {object.<number, accessLevel>[]} [projects] -
     *     If present in an addUser() call, this defines the projects
     *     that the user can access and their access levels
     */
    /**
     * Adds a new user to the DB
     * @param {user} userDefinition
     */
    addUser: function(userDefinition, callback) {
        bcrypt.hash(userDefinition.password, SALT_ROUNDS, function(err, hash) {
            if (err) {
                return callback(err);
            }
            const user = {
                username: userDefinition.username,
                password: hash
            };
            database.insertInto("user", user, function(err) {
                if (err) {
                    return callback(err);
                }
                if (userDefinition.projects) {
                    database.query("user", {username: userDefinition.username}, function(err, rows) {
                        if (err) {
                            return callback(err);
                        }
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
                        database.insertInto("user_project", projects, function(err) {
                            callback(err);
                        });
                    });
                }
                else {
                    callback();
                }
            });
        });
    },
    /**
     * Deletes a user from the DB
     * @param {string} username - The username of the user to delete
     */
    removeUser: function(username, callback) {
        database.query("user", {username: username}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            const user = rows[0];
            database.deleteRow("user", {username: username}, function(err) {
                if (err) {
                    return callback(err);
                }
                database.deleteRow("user_project", {user_id: user.id}, function(err) {
                    callback(err);
                });
            });
        });

    },
    /**
     * Gives a user access to a project, or changes his/her existing access level
     * @param {string} username
     * @param {number} projectId
     * @param {accessLevel} accessLevel
     * @param {function} callback - Called with an error if one exists
     */
    setAccess: function(username, projectId, accessLevel, callback) {
        database.query("user", {username: username}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            const user = rows[0];
            database.deleteRow("user_project", {user_id: user.id, project_id: projectId}, function(err) {
                if (err) {
                    return callback(err);
                }
                database.insertInto("user_project", {user_id: user.id, project_id: projectId, access_level: accessLevel}, function(err) {
                    callback(err);
                });
            });
        });
    },
    /**
     * Gets the access level for the given user and project
     * @param {string} username
     * @param {number} projectId
     * @param {function} callback - Called with the signature callback(error, accessLevel).
     *                              If the user does not have access, the error will reflect that.
     */
    getAccess: function(username, projectId, callback) {
        database.query({"user": "id", "user_project": "user_id"}, {username: username, project_id: projectId}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            if (rows.length === 0) {
                return callback(new Error(username + " does not have access to project id " + projectId));
            }
            callback(null, rows[0].access_level);
        });
    },
    /**
     * Removes a user's access to a project
     * @param {string} username
     * @param {number} projectId
     * @param {function} callback - Called with an error if one exists
     */
    revokeAccess: function(username, projectId, callback) {
        database.query("user", {username: username}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            const user = rows[0];
            database.deleteRow("user_project", {user_id: user.id, project_id: projectId}, function(err) {
                callback(err);
            });
        });
    },
    /**
     * Authenticates a user (optionally, to a project)
     * @param {string} username - The user's username
     * @param {string} password - The user's password (plaintext)
     * @param {number} [projectId] - The project's id, if applicable
     * @param {function} callback - Called with the signature callback(error, isAllowed),
     *                              where isAllowed is true if the user authenticates and
     *                              false if otherwise
     */
    authenticate: function(username, password, projectId, callback) {
        if (typeof projectId === 'function') {
            callback = projectId;
            projectId = undefined;
        }
        database.query("user", {username: username}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            const user = rows[0];
            bcrypt.compare(password, user.password, function(err, matches) {
                if (err) {
                    return callback(err);
                }
                if (typeof projectId === 'number') {
                    database.query("user_project", {user_id: user.id, project_id: projectId}, function(err, rows) {
                        if (err) {
                            return callback(err);
                        }
                        if (rows.length === 0) {
                            return callback(null, false);
                        }
                        else {
                            return callback(null, true);
                        }
                    });
                }
                else {
                    return callback(null, matches);
                }
            });
        });
    }
};