const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const expect = require("chai").expect;
const database = require("../lib/database");
const projectManager = require("../lib/projectManager");
const auth = require("../lib/auth");

Promise.promisifyAll(fs);

describe("Auth", function() {
    let db;

    beforeEach(function() {
        return new Promise(function (resolve, reject) {
            db = new sqlite3.Database(path.join(".", "test.db"), function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            })
        }).then(() => {
            return database.setDB(path.join(".", "test.db"))
        }).then(() => {
            return database.createTable("project", {
                id: {type: "integer", primaryKey: true},
                name: {type: "text", unique: true, notNull: true}
            });
        }).then(() => {
            return database.createTable("user", {
                id: {type: "integer", primaryKey: true},
                username: {type: "text", unique: true, notNull: true},
                password: {type: "text", notNull: true}
            });
        }).then(() => {
            return database.createTable("user_project", {
                user_id: {type: "integer", foreignKey: {user: "id"}},
                project_id: {type: "integer", foreignKey: {project: "id"}},
                access_level: {type: "text", notNull: true}

            });
        }).then(() => {
            return database.insertInto("project", [{name: "project1"}, {name: "project2"}]);
        });
    });

    afterEach(function() {
        return fs.unlinkAsync(path.join(".", "test.db"));
    });

    it("adds a new user and hashes the password", function() {
        return auth.addUser({username: "user1", password: "password"})
            .then(() => database.query("user", {id: 1}))
            .then((rows) => {
                expect(rows).to.have.length(1);
                expect(rows[0].username).to.equal("user1");
                expect(rows[0].password).to.not.equal("password");
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("hashes identical passwords with different salts", function() {
        return auth.addUser({username: "user1", password: "password"})
            .then(() => auth.addUser({username: "user2", password: "password"}))
            .then(() => database.query("user", {id: 1}))
            .then((rows) => rows[0])
            .then((user1) => {
                return database.query("user", {id: 2})
                    .then((rows) => rows[0])
                    .then((user2) => {
                        expect(user1.password).to.not.equal(user2.password);
                    });
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("authenticates a user", function() {
        return auth.addUser({username: "user1", password: "password"})
            .then(() => auth.authenticate("user1", "password"))
            .then((hasAccess) => {
                expect(hasAccess).to.be.true;
            })
            .then(() => auth.authenticate("user1", "notThePassword"))
            .then((hasAccess) => {
                expect(hasAccess).to.be.false;
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("authenticates a user for a project", function() {
        return auth.addUser({username: "user1", password: "password", projects: [ {1: auth.accessLevels.ADMIN}, {2: auth.accessLevels.CONTRIBUTOR} ] })
            .then(() => auth.authenticate("user1", "password", 1))
            .then((hasAccess) => {
                expect(hasAccess).to.be.true;
            })
            .then(() => auth.authenticate("user1", "password", 2))
            .then((hasAccess) => {
                expect(hasAccess).to.be.true;
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("retrieves a user's access level for a project", function() {
        return auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.ADMIN}]})
            .then(() => auth.getAccess("user1", 1))
            .then((accessLevel) => {
                expect(accessLevel).to.equal(auth.accessLevels.ADMIN);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("gives a user access to a new project", function() {
        return auth.addUser({username: "user1", password: "password"})
            .then(() => auth.setAccess("user1", 1, auth.accessLevels.ADMIN))
            .then(() => auth.getAccess("user1", 1))
            .then((accessLevel) => {
                expect(accessLevel).to.equal(auth.accessLevels.ADMIN);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("changes a user's access level to a project", function() {
        return auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.CONTRIBUTOR}]})
            .then(() => auth.setAccess("user1", 1, auth.accessLevels.ADMIN))
            .then(() => auth.getAccess("user1", 1))
            .then((accessLevel) => {
                expect(accessLevel).to.equal(auth.accessLevels.ADMIN);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("revokes a user's access to a project", function() {
        return auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.CONTRIBUTOR}]})
            .then(() => auth.revokeAccess("user1", 1))
            .then(() => auth.getAccess("user1", 1))
            .then((accessLevel) => {
                expect(accessLevel).to.not.exist;
            })
            .catch((err) => {
                expect(err).to.exist;
                expect(err.message).to.equal("user1 does not have access to project id 1");
            });
    });

    it("deletes a user", function() {
        return auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.CONTRIBUTOR}]})
            .then(() => auth.removeUser("user1"))
            .then(() => database.query("user", {username: "user1"}))
            .then((rows) => {
                expect(rows).to.have.length(0);
            })
            .then(() => database.query("user_project", {user_id: 1}))
            .then((rows) => {
                expect(rows).to.have.length(0);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });
});