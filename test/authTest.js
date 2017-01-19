const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const expect = require("chai").expect;
const database = require("../lib/database");
const projectManager = require("../lib/projectManager");
const auth = require("../lib/auth");

describe("Auth", function() {
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
                // create the project table
                database.createTable("project", {
                    id: {type: "integer", primaryKey: true},
                    name: {type: "text", unique: true, notNull: true},
                    root_directory: {type: "text", notNull: true}
                }, function(err) {
                    if (err) {
                        throw err;
                    }
                    // create the user table
                    database.createTable("user", {
                        id: {type: "integer", primaryKey: true},
                        username: {type: "text", unique: true, notNull: true},
                        password: {type: "text", notNull: true}
                    }, function(err) {
                        if (err) {
                            throw err;
                        }
                        // create the linking table
                        database.createTable("user_project", {
                            user_id: {type: "integer", foreignKey: {user: "id"}},
                            project_id: {type: "integer", foreignKey: {project: "id"}},
                            access_level: {type: "text", notNull: true}
                        }, function(err) {
                            if (err) {
                                throw err;
                            }
                            // populate the project table
                            database.insertInto("project", [
                                {name: "project1", root_directory: "/some/directory"},
                                {name: "project2", root_directory: "/some/other/directory"}
                            ], function(err) {
                                if (err) {
                                    throw err;
                                }
                                done();
                            });
                        });
                    });
                });
            });
        });
    });

    afterEach(function(done) {
        fs.unlink(path.join(".", "test.db"), done);
    });

    it("adds a new user and hashes the password", function(done) {
        auth.addUser({username: "user1", password: "password"}, function(err) {
            expect(err).to.not.exist;
            database.query("user", {id: 1}, function(err, rows) {
                expect(err).to.not.exist;
                expect(rows).to.have.length(1);
                expect(rows[0].username).to.equal("user1");
                expect(rows[0].password).to.not.equal("password");
                done();
            });
        });
    });

    it("hashes identical passwords with different salts", function(done) {
        auth.addUser({username: "user1", password: "password"}, function(err) {
            expect(err).to.not.exist;
            auth.addUser({username: "user2", password: "password"}, function(err) {
                expect(err).to.not.exist;
                database.query("user", {id: 1}, function(err, rows) {
                    expect(err).to.not.exist;
                    const user1 = rows[0];
                    database.query("user", {id: 2}, function(err, rows) {
                        expect(err).to.not.exist;
                        const user2 = rows[0];
                        expect(user1.password).to.not.equal(user2.password);
                        done();
                    });
                });
            });
        });
    });

    it("authenticates a user", function(done) {
        auth.addUser({username: "user1", password: "password"}, function(err) {
            expect(err).to.not.exist;
            auth.authenticate("user1", "password", function(err, isAllowed) {
                expect(err).to.not.exist;
                expect(isAllowed).to.be.true;
                auth.authenticate("user1", "notThePassword", function(err, isAllowed) {
                    expect(err).to.not.exist;
                    expect(isAllowed).to.be.false;
                    done();
                });
            });
        });
    });

    it("authenticates a user for a project", function(done) {
        auth.addUser({username: "user1", password: "password", projects: [
            {1: auth.accessLevels.ADMIN},
            {2: auth.accessLevels.CONTRIBUTOR}
        ]}, function(err) {
            expect(err).to.not.exist;
            auth.authenticate("user1", "password", 1, function(err, isAllowed) {
                expect(err).to.not.exist;
                expect(isAllowed).to.be.true;
                auth.authenticate("user1", "password", 2, function(err, isAllowed) {
                    expect(err).to.not.exist;
                    expect(isAllowed).to.be.true;
                    done();
                });
            });
        });
    });

    it("retrieves a user's access level for a project", function(done) {
        auth.addUser({username: "user1", password: "password", projects: [
            {1: auth.accessLevels.ADMIN}
        ]}, function(err) {
            expect(err).to.not.exist;
            auth.getAccess("user1", 1, function(err, accessLevel) {
                expect(err).to.not.exist;
                expect(accessLevel).to.equal(auth.accessLevels.ADMIN);
                done();
            });
        });
    });

    it("gives a user access to a new project", function(done) {
        auth.addUser({username: "user1", password: "password"}, function(err) {
            expect(err).to.not.exist;
            auth.setAccess("user1", 1, auth.accessLevels.ADMIN, function(err) {
                expect(err).to.not.exist;
                auth.getAccess("user1", 1, function(err, accessLevel) {
                    expect(err).to.not.exist;
                    expect(accessLevel).to.equal(auth.accessLevels.ADMIN);
                    done();
                });
            });
        });
    });

    it("changes a user's access level to a project", function(done) {
        auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.CONTRIBUTOR}]}, function(err) {
            expect(err).to.not.exist;
            auth.setAccess("user1", 1, auth.accessLevels.ADMIN, function(err) {
                expect(err).to.not.exist;
                auth.getAccess("user1", 1, function(err, accessLevel) {
                    expect(err).to.not.exist;
                    expect(accessLevel).to.equal(auth.accessLevels.ADMIN);
                    done();
                });
            });
        });
    });

    it("revokes a user's access to a project", function(done) {
        auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.CONTRIBUTOR}]}, function(err) {
             expect(err).to.not.exist;
             auth.revokeAccess("user1", 1, function(err) {
                 expect(err).to.not.exist;
                 auth.getAccess("user1", 1, function(err, accessLevel) {
                     expect(err).to.exist;
                     expect(accessLevel).to.not.exist;
                     done();
                 });
             });
        });
    });

    it("deletes a user", function(done) {
        auth.addUser({username: "user1", password: "password", projects: [{1: auth.accessLevels.CONTRIBUTOR}]}, function(err) {
            expect(err).to.not.exist;
            auth.removeUser("user1", function(err) {
                expect(err).to.not.exist;
                database.query("user", {username: "user1"}, function(err, rows) {
                    expect(err).to.not.exist;
                    expect(rows).to.have.length(0);
                    database.query("user_project", {user_id: 1}, function(err, rows) {
                        expect(err).to.not.exist;
                        expect(rows).to.have.length(0);
                        done();
                    });
                });
            });
        });
    });
});