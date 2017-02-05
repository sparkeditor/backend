const database = require("../database");

/**
 * Performs initial setup
 * @returns {Promise}
 */
module.exports = function() {
    // initial DB setup
    return database.createTable("project", {
        id: {type: "integer", primaryKey: true},
        name: {type: "text", unique: true, notNull: true}
    }).then(() => database.createTable("user", {
        id: {type: "integer", primaryKey: true},
        username: {type: "text", unique: true, notNull: true},
        password: {type: "text", notNull: true}
    })).then(() => database.createTable("user_project", {
        user_id: {type: "integer", foreignKey: {user: "id"}},
        project_id: {type: "integer", foreignKey: {project: "id"}},
        access_level: {type: "text", notNull: true}
    }));
};