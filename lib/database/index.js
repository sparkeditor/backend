const Promise = require("bluebird");
const os = require("os");
const path = require("path");
const sqlite3 = require("sqlite3");
const ConfigurationManager = require("../configurationManager");
const fileIO = require("../fileIO");

const configurationManager = new ConfigurationManager(
    path.join(os.homedir(), ".spark", "config.json")
);

// promisifyDBMethods();
Promise.promisifyAll(sqlite3.Database.prototype);

/**
 * The sqlite3.Database instance
 */
let db;

const databasePath = configurationManager.getValue(
    "databasePath",
    path.join(os.homedir(), ".spark", "spark.db")
);
fileIO.createDirSync(path.dirname(databasePath));
db = new sqlite3.Database(databasePath);

/**
 * This module exposes a limited API to interact with a SQLite database
 */
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
     * @returns {Promise}
     */
    setDB: function(newDBPath) {
        return fileIO.createDir(path.dirname(newDBPath)).then(function() {
            return new Promise(function(resolve, reject) {
                let newDB = new sqlite3.Database(newDBPath, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        db = newDB;
                        resolve();
                    }
                });
            });
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
     * @property {object.<string, string>} [foreignKey] -
     *     If the column is a foreign key, this parameter
     *     is an object where the key is the foreign key table
     *     name and the value is the foreign key column name
     */
    /**
     * Creates a new table if it doesn't already exist
     * @param {string} name - The table name
     * @param {Object.<string, columnDef>} definition -
     *     The table definition. The keys are column names and the object
     *     are column definitions
     * @returns {Promise}
     */
    createTable: function(name, definition) {
        let sql = "CREATE TABLE IF NOT EXISTS " + name + " (";
        let constraintClause = "";
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
            if (columnDef.foreignKey) {
                for (const foreignTableName in columnDef.foreignKey) {
                    if (
                        !columnDef.foreignKey.hasOwnProperty(foreignTableName)
                    ) {
                        continue;
                    }
                    foreignColumnName = columnDef.foreignKey[foreignTableName];
                    constraintClause +=
                        "FOREIGN KEY (" +
                        columnName +
                        ") REFERENCES " +
                        foreignTableName +
                        "(" +
                        foreignColumnName +
                        "), ";
                }
            }
            sql = sql.slice(0, -1);
            sql += ", ";
        }
        if (constraintClause.length > 0) {
            constraintClause = constraintClause.slice(0, -2);
            sql += constraintClause;
        } else {
            sql = sql.slice(0, -2);
        }
        sql += ")";
        return db.runAsync(sql);
    },
    /**
     * Inserts a row into a table
     * @param {string} tableName - The name of the table
     * @param {object|object[]} values - Row values. The key is the column name,
     *                                and the value is the column value. If
     *                                this is an array, it represents multiple
     *                                rows to insert into the table
     * @returns {Promise}
     */
    insertInto: function(tableName, values) {
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
                    value = '"' + value + '"';
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
        return db.runAsync(sql);
    },
    /**
     * A join clause definition that supports joining two tables
     *
     * @typedef {object.<string, string>} joinClause
     * An object with two values. The key for each
     * represents a table name, and the values are the
     * columns of those tables that should be joined on.
     */
    /**
     * Performs a simple query against the database
     * @param {string|joinClause} tableName - The name of the table to query
     * @param {object} queryDefinition - The query conditions.
     *                                   The key is the column name, and
     *                                   the value is the desired value
     * @returns {Promise} - Resolves with the results array or an error
     */
    query: function(tableName, queryDefinition) {
        let joinClause;
        if (typeof tableName === "object") {
            joinClause = tableName;
            tableName = Object.keys(joinClause)[0];
        }
        let sql = "SELECT * from " + tableName + " ";
        if (joinClause) {
            const joinTableName = Object.keys(joinClause)[1];
            const tableColumn = joinClause[tableName];
            const joinTableColumn = joinClause[joinTableName];
            sql +=
                "JOIN " +
                joinTableName +
                " ON " +
                joinTableName +
                "." +
                joinTableColumn +
                " = " +
                tableName +
                "." +
                tableColumn +
                " ";
        }
        let whereClause = "WHERE ";
        for (const columnName in queryDefinition) {
            if (!queryDefinition.hasOwnProperty(columnName)) {
                continue;
            }
            let desiredValue = queryDefinition[columnName];
            if (typeof desiredValue === "string") {
                desiredValue = '"' + desiredValue + '"';
            }
            whereClause += columnName + " = " + desiredValue + " AND ";
        }
        whereClause = whereClause.slice(0, -5);
        sql += whereClause;
        return db.allAsync(sql);
    },
    /**
     * Deletes a row from the database
     * @param {string} tableName - The name of the table to delete from
     * @param {object} queryDefinition - The deletion conditions.
     *                                   The key is the column name, and
     *                                   the value is the desired value
     * @returns {Promise}
     */
    deleteRow: function(tableName, queryDefinition) {
        let sql = "DELETE FROM " + tableName + " WHERE ";
        let whereClause = "";
        for (const columnName in queryDefinition) {
            if (!queryDefinition.hasOwnProperty(columnName)) {
                continue;
            }
            let desiredValue = queryDefinition[columnName];
            if (typeof desiredValue === "string") {
                desiredValue = '"' + desiredValue + '"';
            }
            whereClause += columnName + " = " + desiredValue + " AND ";
        }
        whereClause = whereClause.slice(0, -5);
        sql += whereClause;
        return db.runAsync(sql);
    }
};

module.exports = database;

function promisifyDBMethods() {
    sqlite3.Database.prototype.runAsync = function(sql) {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.run(sql, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    };
    sqlite3.Database.prototype.allAsync = function(sql) {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.all(sql, function(err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    };
    sqlite3.Database.prototype.getAsync = function(sql) {
        const self = this;
        return new Promise(function(resolve, reject) {
            self.get(sql, function(err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    };
}
