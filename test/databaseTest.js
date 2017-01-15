const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const database = require("../lib/database");
const expect = require("chai").expect;

describe("Database", function() {
    let db;

    beforeEach(function(done) {
        db = new sqlite3.Database(path.join(".", "test.db"), function(err) {
            if (err) {
                throw err;
            }
            database.setDB(path.join(".", "test.db"), function(err) {
                if (err) {
                    throw err;
                }
                done();
            });
        });
    });

    afterEach(function(done) {
        fs.unlink(path.join(".", "test.db"), () => done());
    });

    it("exposes the sqlite3 Database instance", function() {
        const sqliteDB = database.getDB();
        expect(sqliteDB).to.be.an.instanceof(sqlite3.Database);
    });

    it("creates a new table", function(done) {
        database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function(error) {
            expect(error).to.not.exist;
            db.get("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'", function(err, result) {
                 expect(err).to.not.exist;
                 expect(result["count(*)"]).to.equal(1);
                 expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
                 done();
            });
        });
    });

    it("fails silently creating a table that already exists", function(done) {
       database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function(error) {
           expect(error).to.not.exist;
           db.get("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'", function(err, result) {
               expect(err).to.not.exist;
               expect(result["count(*)"]).to.equal(1);
               expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
               database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function(error) {
                   expect(error).to.not.exist;
                   db.get("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'", function(err, result) {
                       expect(err).to.not.exist;
                       expect(result["count(*)"]).to.equal(1);
                       expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
                       database.createTable("test1", {differentFoo: {type: "integer", primaryKey: true}, differentBar: {type: "text"}}, function(error) {
                           expect(error).to.not.exist;
                           db.get("SELECT sql, count(*) FROM sqlite_master WHERE type='table' AND name='test1'", function (err, result) {
                               expect(err).to.not.exist;
                               expect(result["count(*)"]).to.equal(1);
                               expect(result.sql.toLowerCase()).to.equal("create table test1 (foo integer primary key, bar text)");
                               done();
                           });
                       });
                   });
               });
           });
       });
    });

    it("adds a row to a table", function(done) {
        database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function(err) {
            expect(err).to.not.exist;
            database.insertInto("test1", {foo: 3, bar: "test"}, function(err) {
                expect(err).to.not.exist;
                db.all("SELECT * FROM test1", function(err, rows) {
                    expect(err).to.not.exist;
                    expect(rows.length).to.equal(1);
                    expect(rows[0].foo).to.equal(3);
                    expect(rows[0].bar).to.equal("test");
                    done();
                });
            });
        });
    });

    it("adds multiple rows to a table", function(done) {
        // insertInto("test1" [{foo: 1, etc...}, {}]
        database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function(err) {
            expect(err).to.not.exist;
            database.insertInto("test1", [{foo: 3, bar: "test"}, {foo: 5, bar: "test2"}], function(err) {
                expect(err).to.not.exist;
                db.all("SELECT * FROM test1", function(err, rows) {
                    expect(err).to.not.exist;
                    expect(rows.length).to.equal(2);
                    expect(rows[0].foo).to.equal(3);
                    expect(rows[1].foo).to.equal(5);
                    expect(rows[0].bar).to.equal("test");
                    expect(rows[1].bar).to.equal("test2");
                    done();
                });
            });
        });
    });

    it("gets data from a table", function(done) {
        database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function(err) {
            expect(err).to.not.exist;
            database.insertInto("test1", {foo: 3, bar: "test"}, function(err) {
                expect(err).to.not.exist;
                database.query("test1", {bar: "test"}, function(err, result) {
                    expect(err).to.not.exist;
                    expect(result).to.be.an("array");
                    expect(result).to.have.length(1);
                    expect(result[0]).to.deep.equal({foo: 3, bar: "test"});
                    done();
                });
            });
        });
    });

    it("deletes rows from a table", function(done) {
        database.createTable("test1", {foo: {type: "integer", primaryKey: true}, bar: {type: "text"}}, function (err) {
            expect(err).to.not.exist;
            database.insertInto("test1", {foo: 3, bar: "test"}, function (err) {
                expect(err).to.not.exist;
                database.deleteRow("test1", {foo: 3}, function(err) {
                    expect(err).to.not.exist;
                    db.all("SELECT * FROM test1 WHERE foo = 3", function(err, rows) {
                        expect(err).to.not.exist;
                        expect(rows).to.have.length(0);
                        done();
                    });
                });
            });
        });
    });
});