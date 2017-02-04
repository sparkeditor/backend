const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const database = require("../lib/database");
const expect = require("chai").expect;

Promise.promisifyAll(fs);

describe("Database", function() {
    let db;

    beforeEach(function() {
        return new Promise(function (resolve, reject) {
            db = new sqlite3.Database(path.join(".", "test.db"), function (err) {
                if (err) {
                    reject(err);
                }
                database.setDB(path.join(".", "test.db")).then(resolve);
            });
        });
    });

    afterEach(function() {
        return fs.unlinkAsync(path.join(".", "test.db"));
    });

    it("exposes the sqlite3 Database instance", function() {
        const sqliteDB = database.getDB();
        expect(sqliteDB).to.be.an.instanceof(sqlite3.Database);
    });

    it("creates a new table", function() {
        return database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}})
            .then(() => db.getAsync("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'"))
            .then((result) => {
                expect(result["count(*)"]).to.equal(1);
                expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });


    it("fails silently creating a table that already exists", function() {
        return database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}})
            .then(() => db.getAsync("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'"))
            .then((result) => {
                expect(result["count(*)"]).to.equal(1);
                expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
            })
            .then(() => database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}))
            .then(() => db.getAsync("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'"))
            .then((result) => {
                expect(result["count(*)"]).to.equal(1);
                expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
            })
            .then(() => database.createTable("test1", {differentFoo: {type: "integer", primaryKey: true}, differentBar: {type: "text"}}))
            .then(() => db.getAsync("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'"))
            .then((result) => {
                expect(result["count(*)"]).to.equal(1);
                expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("adds a row to a table", function() {
        return database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}})
            .then(() => database.insertInto("test1", {foo: 3, bar: "test"}))
            .then(() => db.allAsync("SELECT * FROM test1"))
            .then((rows) => {
                expect(rows.length).to.equal(1);
                expect(rows[0].foo).to.equal(3);
                expect(rows[0].bar).to.equal("test");
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("adds multiple rows to a table", function() {
        return database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}})
            .then(() => database.insertInto("test1", [{foo: 3, bar: "test"}, {foo: 5, bar: "test2"}]))
            .then(() => db.allAsync("SELECT * FROM test1"))
            .then((rows) => {
                expect(rows.length).to.equal(2);
                expect(rows[0].foo).to.equal(3);
                expect(rows[1].foo).to.equal(5);
                expect(rows[0].bar).to.equal("test");
                expect(rows[1].bar).to.equal("test2");
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("gets data from a table", function() {
        return database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}})
            .then(() => database.insertInto("test1", {foo: 3, bar: "test"}))
            .then(() => database.query("test1", {bar: "test"}))
            .then((result) => {
                expect(result).to.be.an("array");
                expect(result).to.have.length(1);
                expect(result[0]).to.deep.equal({foo: 3, bar: "test"});
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("queries with a JOIN clause", function() {
        return database.createTable("test1", { foo: { type: "integer", primaryKey: true }, bar: { type: "text" }})
            .then(() => database.createTable("test2", { id: { type: "integer", primaryKey: true }, test1_fk: { type: "integer", foreignKey: { "test1": "foo" }}}))
            .then(() => database.insertInto("test1", {foo: 3, bar: "test"}))
            .then(() => database.insertInto("test2", {id: 1, test1_fk: 3}))
            .then(() => database.query({"test1": "foo", "test2": "test1_fk"}, {bar: "test"}))
            .then((result) => {
                expect(result).to.be.an("array");
                expect(result).to.have.length(1);
                expect(result[0]).to.deep.equal({foo: 3, bar: "test", id: 1, test1_fk: 3});
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("deletes rows from a table", function() {
        return database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}})
            .then(() => database.insertInto("test1", {foo: 3, bar: "test"}))
            .then(() => database.deleteRow("test1", {foo: 3}))
            .then(() => db.allAsync("SELECT * FROM test1 WHERE foo = 3"))
            .then((rows) => {
                expect(rows).to.have.length(0);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });
});