const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const mock = require("mock-fs");
const os = require("os");
const expect = require("chai").expect;
const database = require("../lib/database");
const projectManager = require("../lib/projectManager");

const homeDir = os.homedir();

describe("ProjectManager", function() {
    let db;

    beforeEach(function(done) {
        mock({
            "/some/directory": {},
            homeDir: {}
        });
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
                    name: {type: "text", unique: true, notNull: true}
                }, function(err) {
                    if (err) {
                        throw err;
                    }
                    done();
                });
            });
        });
    });

    afterEach(function(done) {
        mock.restore();
        fs.unlink(path.join(".", "test.db"), done);
    });

    it("creates and persists a new project", function(done) {
        projectManager.createProject({name: "MyProject"}, function(error) {
            expect(error).to.not.exist;
            db.all("SELECT * FROM project WHERE id = 1", function(err, rows) {
                expect(err).to.not.exist;
                expect(rows).to.have.length(1);
                expect(rows[0]).to.deep.equal({id: 1, name: "MyProject"});
                fs.lstat(path.join(homeDir, ".spark", "projects", "MyProject"), function(err, stats) {
                    expect(err).to.not.exist;
                    expect(stats.isDirectory()).to.be.true;
                    done();
                });
            });
        });
    });

    it("creates and persists a new project with a different root_directory", function(done) {
        projectManager.createProject({name: "MyProject", root_directory: "/some/directory"}, function(error) {
            console.log(error);
            expect(error).to.not.exist;
            db.all("SELECT * FROM project WHERE id = 1", function(err, rows) {
                expect(err).to.not.exist;
                expect(rows).to.have.length(1);
                expect(rows[0]).to.deep.equal({id: 1, name: "MyProject"});
                fs.lstat(path.join(homeDir, ".spark", "projects", "MyProject"), function(err, stats) {
                    expect(err).to.not.exist;
                    expect(stats.isSymbolicLink()).to.be.true;
                    done();
                });
            });
        });

    });

    it("retrieves a project", function(done) {
        projectManager.createProject({name: "MyProject"}, function(error) {
            expect(error).to.not.exist;
            projectManager.getProject(1, function(err, project) {
                expect(err).to.not.exist;
                expect(project).to.deep.equal({id: 1, name: "MyProject"});
                done();
            });
        });
    });

    it("retrieves a project by name", function(done) {
        projectManager.createProject({name: "MyProject"}, function(err) {
            expect(err).to.not.exist;
            projectManager.getProject("MyProject", function(err, project) {
                expect(err).to.not.exist;
                expect(project).to.deep.equal({id: 1, name: "MyProject"});
                done();
            });
        });
    });

    it("retrieves users for a project", function(done) {
        projectManager.createProject({name: "MyProject"}, function(err) {
            expect(err).to.not.exist;
            // mock the auth module functionality
            database.createTable("user",
                {
                    "id": {type: "integer", primaryKey: true},
                    "username": {type: "text", unique: true, notNull: true},
                    "password": {type: "text", notNull: true}
                }, function(err) {
                    expect(err).to.not.exist;
                    database.createTable("user_project",
                        {
                            "user_id": {type: "integer", foreignKey: {"user": "id"}},
                            "project_id": {type: "integer", foreignKey: {"project": "id"}},
                            "access_level": {type: "text", notNull: true}
                        }, function(err) {
                            expect(err).to.not.exist;
                            database.insertInto("user", [{username: "testUser1", password: "password"}, {username: "testUser2", password: "password"}], function(err) {
                                expect(err).to.not.exist;
                                database.insertInto("user_project", [{user_id: 1, project_id: 1, access_level: "ADMIN"}, {user_id: 2, project_id: 1, access_level: "CONTRIBUTOR"}], function(err) {
                                    expect(err).to.not.exist;
                                    projectManager.getUsersForProject(1, function(err, users) {
                                        expect(err).to.not.exist;
                                        expect(users).to.have.length(2);
                                        expect(users).to.deep.equal([
                                            {id: 1, username: "testUser1", password: "password", access_level: "ADMIN"},
                                            {id: 2, username: "testUser2", password: "password", access_level: "CONTRIBUTOR"}
                                        ]);
                                        done();
                                    });
                                });
                            });
                        });
                });
        });
    });

    it("retrieves projects for a user", function(done) {
        projectManager.createProject({name: "MyProject"}, function (err) {
            expect(err).to.not.exist;
            projectManager.createProject({
                name: "MyOtherProject"
            }, function (err) {
                expect(err).to.not.exist;
                // mock the auth module functionality
                database.createTable("user",
                    {
                        "id": {type: "integer", primaryKey: true},
                        "username": {type: "text", unique: true, notNull: true},
                        "password": {type: "text", notNull: true}
                    }, function (err) {
                        expect(err).to.not.exist;
                        database.createTable("user_project",
                            {
                                "user_id": {type: "integer", foreignKey: {"user": "id"}},
                                "project_id": {type: "integer", foreignKey: {"project": "id"}},
                                "access_level": {type: "text", notNull: true}
                            }, function (err) {
                                expect(err).to.not.exist;
                                database.insertInto("user", [{
                                    username: "testUser1",
                                    password: "password"
                                }, {username: "testUser2", password: "password"}], function (err) {
                                    expect(err).to.not.exist;
                                    database.insertInto("user_project", [{
                                        user_id: 1,
                                        project_id: 1,
                                        access_level: "ADMIN"
                                    }, {user_id: 1, project_id: 2, access_level: "CONTRIBUTOR"}], function (err) {
                                        expect(err).to.not.exist;
                                        projectManager.getProjectsForUser(1, function (err, projects) {
                                            expect(err).to.not.exist;
                                            expect(projects).to.have.length(2);
                                            expect(projects).to.deep.equal([
                                                {id: 1, name: "MyProject", access_level: "ADMIN"},
                                                {id: 2, name: "MyOtherProject", access_level: "CONTRIBUTOR"}
                                            ]);
                                            done();
                                        });
                                    });
                                });
                            });
                    });
            });
        });
    });

    it("retrieves projects for a user by username", function(done) {
        projectManager.createProject({name: "MyProject"}, function (err) {
            expect(err).to.not.exist;
            projectManager.createProject({
                name: "MyOtherProject"
            }, function (err) {
                expect(err).to.not.exist;
                // mock the auth module functionality
                database.createTable("user",
                    {
                        "id": {type: "integer", primaryKey: true},
                        "username": {type: "text", unique: true, notNull: true},
                        "password": {type: "text", notNull: true}
                    }, function (err) {
                        expect(err).to.not.exist;
                        database.createTable("user_project",
                            {
                                "user_id": {type: "integer", foreignKey: {"user": "id"}},
                                "project_id": {type: "integer", foreignKey: {"project": "id"}},
                                "access_level": {type: "text", notNull: true}
                            }, function (err) {
                                expect(err).to.not.exist;
                                database.insertInto("user", [{
                                    username: "testUser1",
                                    password: "password"
                                }, {username: "testUser2", password: "password"}], function (err) {
                                    expect(err).to.not.exist;
                                    database.insertInto("user_project", [{
                                        user_id: 1,
                                        project_id: 1,
                                        access_level: "ADMIN"
                                    }, {user_id: 1, project_id: 2, access_level: "CONTRIBUTOR"}], function (err) {
                                        expect(err).to.not.exist;
                                        projectManager.getProjectsForUser("testUser1", function (err, projects) {
                                            expect(err).to.not.exist;
                                            expect(projects).to.have.length(2);
                                            expect(projects).to.deep.equal([
                                                {id: 1, name: "MyProject", access_level: "ADMIN"},
                                                {id: 2, name: "MyOtherProject", access_level: "CONTRIBUTOR"}
                                            ]);
                                            done();
                                        });
                                    });
                                });
                            });
                    });
            });
        });
    });

    it("deletes a project by id", function(done) {
        projectManager.createProject({name: "MyProject"}, function(error) {
            expect(error).to.not.exist;
            projectManager.deleteProject(1, function(err) {
                expect(err).to.not.exist;
                db.all("SELECT * FROM project WHERE id = 1", function(err, rows) {
                    expect(err).to.not.exist;
                    expect(rows).to.have.length(0);
                    done();
                });
            });
        });
    });

    it("deletes a project by name", function(done) {
        projectManager.createProject({name: "MyProject"}, function(error) {
            expect(error).to.not.exist;
            projectManager.deleteProject("MyProject", function(err) {
                expect(err).to.not.exist;
                db.all("SELECT * FROM project WHERE id = 1", function(err, rows) {
                    expect(err).to.not.exist;
                    expect(rows).to.have.length(0);
                    done();
                });
            });
        });
    });
});