const database = require("../database");

/**
 * Performs initial setup
 * @param {function} callback - Called with an error if one exists
 */
module.exports = function(callback) {
    // initial DB setup
    database.createTable("project", {
        id: {type: "integer", primaryKey: true},
        name: {type: "text", unique: true, notNull: true}
    }, function (err) {
        if (err) {
            return callback(err);
        }
        database.createTable("user", {
            id: {type: "integer", primaryKey: true},
            username: {type: "text", unique: true, notNull: true},
            password: {type: "text", notNull: true}
        }, function (err) {
            if (err) {
                return callback(err);
            }
            database.createTable("user_project", {
                user_id: {type: "integer", foreignKey: {user: "id"}},
                project_id: {type: "integer", foreignKey: {project: "id"}},
                access_level: {type: "text", notNull: true}
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback();
            });
        });
    });
}