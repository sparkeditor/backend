/**
 * This module exposes an API to add, remove, and edit project definitions
 */

const database = require("../database");

/**
 * A project definition
 * @typedef {object} projectDefinition
 * @property {string} name - The project name
 * @property {number} id - The project's unique id
 * @property {string} root_directory - The project's root directory
 */

module.exports = {
    /**
     * Creates a new project
     * @param {projectDefinition} projectDefinition
     * @param {function} callback - Called with an error if any exists
     */
    createProject: function(projectDefinition, callback) {
        database.insertInto("project", projectDefinition, function(err) {
            callback(err);
        });
    },
    /**
     * Retrieves a project
     * @param {number} projectId - The id of the project to retrieve
     * @param {function} callback - Called with the signature callback(error, project)
     */
    getProject: function(projectId, callback) {
        database.query("project", {id: projectId}, function(err, rows) {
            callback(err, rows[0]);
        });
    },
    /**
     * Deletes a project
     * @param {number} projectId - The id of the project to delete
     * @param {function} callback - Called with an error if any exists
     */
    deleteProject: function(projectId, callback) {
        database.deleteRow("project", {id: projectId}, function(err) {
            callback(err);
        });
    },
    /**
     * Gets a list of users for the given project
     * @param {number} projectId - The project's id
     * @param {function} callback - Called with the signature callback(error, users).
     *                              Users is an array of user objects, with an added access_level
     *                              property denoting their access level with that project
     */
    getUsersForProject: function(projectId, callback) {
        database.query({"user": "id", "user_project": "user_id"}, {project_id: projectId}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            rows.forEach(function(row) {
                delete row.user_id;
                delete row.project_id;
            });
            callback(null, rows);
        });
    },
    /**
     * Gets a list of projects for the given user
     * @param {number} userId - The user's id
     * @param {function} callback - Called with the signature callback(error, projects).
     *                              Projects is an array of project objects, with an added
     *                              access_level property denoting the given user's access
     *                              level with that project
     */
    getProjectsForUser: function(userId, callback) {
        database.query({"project": "id", "user_project": "project_id"}, {user_id: userId}, function(err, rows) {
            if (err) {
                return callback(err);
            }
            rows.forEach(function(row) {
                delete row.user_id;
                delete row.project_id;
            });
            callback(null, rows);
        });
    }
};