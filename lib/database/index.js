/**
 * This module exposes a limited API to interact with a SQLite database
 */

const os = require("os");
const path = require("path");
const sqlite3 = require("sqlite3");
const ConfigurationManager = require("../configurationManager");
const fileIO = require("../fileIO");

const configurationManager = new ConfigurationManager(path.join(os.homedir(), ".spark", "config.json"));

/**
 * The sqlite3.Database instance
 */
let db;

const databasePath = configurationManager.getValue("databasePath", path.join(os.homedir(), ".spark", "spark.db"));
fileIO.createDir(path.dirname(databasePath));

db = new sqlite3.Database(databasePath);

const database = {
    /**
     * Gets the database instance
     * @returns {sqlite3.Database}
     */
    getDB: function() {
        return db;
    },
    /**
     * Sets the database instance to a different SQLite database
     * @param {string} newDBPath - The filepath to a new or existing SQLite database file
     * @param {function} callback - Called when the new database is successfully opened,
     *                              or with an error if one occurred
     */
    setDB: function(newDBPath, callback) {
        fileIO.createDir(path.dirname(newDBPath), function(err) {
            if (err) {
                callback(err);
            }
            else {
                let newDB = new sqlite3.Database(newDBPath, function(err) {
                    if (err) {
                        callback(err);
                    }
                    else {
                        db = newDB;
                        callback();
                    }
                });
            }
        });
    },
    /**
     * A column definition
     * @typedef {object} columnDef
     * @property {string} type - the column's SQLite data type
     * @property {boolean} [primaryKey=false] - true if the column is a primary key
     * @property {boolean} [unique=false] - true if the column is unique
     * @property {boolean} [notNull=false] - true if the column cannot be null
     * @property {string} [default] - a default value for the column
     */
    /**
     * Creates a new table if it doesn't already exist
     * @param {string} name - The table name
     * @param {Object.<string, columnDef>} definition -
     *     The table definition. The keys are column names and the object
     *     are column definitions
     * @param {function} callback - Called when the table is created. Takes an error object
     */
    createTable: function(name, definition, callback) {
        let sql = "CREATE TABLE IF NOT EXISTS " + name + " (";
        for (const columnName in definition) {
            if (!definition.hasOwnProperty(columnName)) {
                continue;
            }
            const columnDef = definition[columnName];
            sql += columnName + " " + columnDef.type.toLowerCase() + " ";
            if (columnDef.primaryKey) {
                sql += "PRIMARY KEY ";
            }
            if (columnDef.notNull) {
                sql += "NOT NULL ";
            }
            if (columnDef.unique) {
                sql += "UNIQUE ";
            }
            if (columnDef.default) {
                sql += "DEFAULT = " + columnDef.default;
            }
            sql = sql.slice(0, -1);
            sql += ", ";
        }
        sql = sql.slice(0, -2);
        sql += ")";
        db.run(sql, function(err) {
            callback(err);
        });
    },
    /**
     * Inserts a row into a table
     * @param {string} tableName - The name of the table
     * @param {object} values - Row values. The key is the column name,
     *                          and the value is the column value
     * @param {function} callback - Called when the row is inserted. Takes an error object
     */
    insertInto: function(tableName, values, callback) {
        if (!Array.isArray(values)) {
            values = [values];
        }
        const valueMap = {};
        values.forEach(function(columnDef) {
            for (const columnName in columnDef) {
                if (!columnDef.hasOwnProperty(columnName)) {
                    continue;
                }
                const columnValue = columnDef[columnName];
                if (!valueMap[columnName]) {
                    valueMap[columnName] = [];
                }
                valueMap[columnName].push(columnValue);
            }
        });
        let sql = "INSERT INTO " + tableName + " ";
        let columnClause = "(";
        let valueClause = "";
        let valueClauses = [];
        for (const columnName in valueMap) {
            if (!valueMap.hasOwnProperty(columnName)) {
                continue;
            }
            columnClause += columnName + ", ";
            for (let i = 0; i < valueMap[columnName].length; i++) {
                if (!valueClauses[i]) {
                    valueClauses[i] = "(";
                }
                let value = valueMap[columnName][i];
                if (typeof value === "string") {
                    value = "\"" + value + "\"";
                }
                valueClauses[i] += value + ", ";
            }
        }
        columnClause = columnClause.slice(0, -2);
        columnClause += ") ";
        for (let i = 0; i < valueClauses.length; i++) {
            valueClauses[i] = valueClauses[i].slice(0, -2);
            valueClauses[i] += "), ";
            valueClause += valueClauses[i];
        }
        valueClause = valueClause.slice(0, -2);
        sql += columnClause + "VALUES " + valueClause;
        db.run(sql, function(err) {
            callback(err);
        });
    },
    /**
     * Performs a simple query against the database
     * @param {string} tableName - The name of the table to query
     * @param {object} queryDefinition - The query conditions.
     *                                   The key is the column name, and
     *                                   the value is the desired value
     * @param {function} callback - Called after the query is complete with
     *                              the signature callback(error, results).
     *                              results is always an array
     */
    query: function(tableName, queryDefinition, callback) {
        let sql = "SELECT * from " + tableName + " WHERE ";
        let whereClause = "";
        for (const columnName in queryDefinition) {
            if (!queryDefinition.hasOwnProperty(columnName)) {
                continue;
            }
            let desiredValue = queryDefinition[columnName];
            if (typeof desiredValue === 'string') {
                desiredValue = "\"" + desiredValue + "\"";
            }
            whereClause += columnName + " = " + desiredValue + " AND ";
        }
        whereClause = whereClause.slice(0, -5);
        sql += whereClause;
        db.all(sql, function(error, rows) {
            callback(error, rows);
        });
    },
    /**
     * Deletes a row from the database
     * @param {string} tableName - The name of the table to delete from
     * @param {object} queryDefinition - The deletion conditions.
     *                                   The key is the column name, and
     *                                   the value is the desired value
     * @param {function} callback - Called after the deletion is complete with
     *                              the signature callback(error)
     */
    deleteRow: function(tableName, queryDefinition, callback) {
        let sql = "DELETE FROM " + tableName + " WHERE ";
        let whereClause = "";
        for (const columnName in queryDefinition) {
            if (!queryDefinition.hasOwnProperty(columnName)) {
                continue;
            }
            let desiredValue = queryDefinition[columnName];
            if (typeof desiredValue === 'string') {
                desiredValue = "\"" + desiredValue + "\"";
            }
            whereClause += columnName + " = " + desiredValue + " AND ";
        }
        whereClause = whereClause.slice(0, -5);
        sql += whereClause;
        db.run(sql, function(error) {
            callback(error);
        });
    }
};

module.exports = database;