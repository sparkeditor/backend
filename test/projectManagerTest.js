const Promise = require("bluebird");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3");
const mock = require("mock-fs");
const os = require("os");
const expect = require("chai").expect;
const database = require("../lib/database");
const projectManager = require("../lib/projectManager");

Promise.promisifyAll(fs);

const homeDir = os.homedir();

describe("ProjectManager", function() {
    let db;

    beforeEach(function () {
        const mockConfig = {};
        mockConfig["/some/directory"] = {"a_file": "This is a file!"};
        mockConfig[homeDir] = {};
        mock(mockConfig, {createCwd: false});
        return new Promise(function(resolve, reject) {
            db = new sqlite3.Database(path.join(".", "test.db"), function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        })
            .then(() => database.setDB(path.join(".", "test.db")))
            .then(() => database.createTable("project", { id: {type: "integer", primaryKey: true}, name: {type: "text", unique: true, notNull: true}}));
    });

    afterEach(function () {
        mock.restore();
        return fs.unlink(path.join(".", "test.db"));
    });

    it("creates and persists a new project", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => db.allAsync("SELECT * FROM project WHERE id = 1"))
            .then((rows) => {
                expect(rows).to.have.length(1);
                expect(rows[0]).to.deep.equal({id: 1, name: "MyProject"});
            })
            .then(() => fs.lstatAsync(path.join(homeDir, ".spark", "projects", "MyProject")))
            .then((stats) => {
                expect(stats.isDirectory()).to.be.true;
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("creates and persists a new project with a different root_directory", function () {
        return projectManager.createProject({name: "MyProject", root_directory: "/some/directory"})
            .then(() => db.allAsync("SELECT * FROM project WHERE id = 1"))
            .then((rows) => {
                expect(rows).to.have.length(1);
                expect(rows[0]).to.deep.equal({id: 1, name: "MyProject"});
            })
            .then(() => fs.lstatAsync(path.join(homeDir, ".spark", "projects", "MyProject")))
            .then((stats) => {
                expect(stats.isSymbolicLink()).to.be.true;
            });
    });

    it("retrieves a project", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => projectManager.getProject(1))
            .then((project) => {
                expect(project).to.deep.equal({id: 1, name: "MyProject", root_directory: "/home/jeremy/.spark/projects/MyProject"});
            })
            .catch((err) => {
                console.log(err);
                expect(err).to.not.exist;
            });
    });

    it("retrieves a project by name", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => projectManager.getProject("MyProject"))
            .then((project) => {
                expect(project).to.deep.equal({id: 1, name: "MyProject", root_directory: "/home/jeremy/.spark/projects/MyProject"});
            })
            .catch((err) => {
                console.log(err);
                expect(err).to.not.exist;
            });
    });

    it("retrieves users for a project", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => database.createTable("user", {
                "id": {type: "integer", primaryKey: true},
                "username": {type: "text", unique: true, notNull: true},
                "password": {type: "text", notNull: true}}))
            .then(() => database.createTable("user_project", {
                "user_id": {type: "integer", foreignKey: {"user": "id"}},
                "project_id": {type: "integer", foreignKey: {"project": "id"}},
                "access_level": {type: "text", notNull: true}}))
            .then(() => database.insertInto("user", [
                {username: "testUser1", password: "password"},
                {username: "testUser2", password: "password"}]))
            .then(() => database.insertInto("user_project", [
                {user_id: 1, project_id: 1, access_level: "ADMIN"},
                {user_id: 2, project_id: 1, access_level: "CONTRIBUTOR"}]))
            .then(() => projectManager.getUsersForProject(1))
            .then((users) => {
                expect(users).to.have.length(2);
                expect(users).to.deep.equal([
                    {id: 1, username: "testUser1", password: "password", access_level: "ADMIN"},
                    {id: 2, username: "testUser2", password: "password", access_level: "CONTRIBUTOR"}
                ]);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            })
    });

    it("retrieves projects for a user", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => projectManager.createProject({name: "MyOtherProject"}))
            .then(() => database.createTable("user", {
                "id": {type: "integer", primaryKey: true},
                "username": {type: "text", unique: true, notNull: true},
                "password": {type: "text", notNull: true}}))
            .then(() => database.createTable("user_project", {
                "user_id": {type: "integer", foreignKey: {"user": "id"}},
                "project_id": {type: "integer", foreignKey: {"project": "id"}},
                "access_level": {type: "text", notNull: true}}))
            .then(() => database.insertInto("user", [
                {username: "testUser1", password: "password"},
                {username: "testUser2", password: "password"}]))
            .then(() => database.insertInto("user_project", [
                {user_id: 1,  project_id: 1, access_level: "ADMIN"},
                {user_id: 1, project_id: 2, access_level: "CONTRIBUTOR"}]))
            .then(() => projectManager.getProjectsForUser(1))
            .then((projects) => {
                expect(projects).to.have.length(2);
                expect(projects).to.deep.equal([
                    {id: 1, name: "MyProject", access_level: "ADMIN"},
                    {id: 2, name: "MyOtherProject", access_level: "CONTRIBUTOR"}
                ]);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("retrieves projects for a user by username", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => projectManager.createProject({name: "MyOtherProject"}))
            .then(() => database.createTable("user", {
                "id": {type: "integer", primaryKey: true},
                "username": {type: "text", unique: true, notNull: true},
                "password": {type: "text", notNull: true}}))
            .then(() => database.createTable("user_project", {
                "user_id": {type: "integer", foreignKey: {"user": "id"}},
                "project_id": {type: "integer", foreignKey: {"project": "id"}},
                "access_level": {type: "text", notNull: true}}))
            .then(() => database.insertInto("user", [
                {username: "testUser1", password: "password"},
                {username: "testUser2", password: "password"}]))
            .then(() => database.insertInto("user_project", [
                {user_id: 1,  project_id: 1, access_level: "ADMIN"},
                {user_id: 1, project_id: 2, access_level: "CONTRIBUTOR"}]))
            .then(() => projectManager.getProjectsForUser("testUser1"))
            .then((projects) => {
                expect(projects).to.have.length(2);
                expect(projects).to.deep.equal([
                    {id: 1, name: "MyProject", access_level: "ADMIN"},
                    {id: 2, name: "MyOtherProject", access_level: "CONTRIBUTOR"}
                ]);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("deletes a project by id", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => projectManager.deleteProject(1))
            .then(() => db.allAsync("SELECT * FROM project WHERE id = 1"))
            .then((rows) => {
                expect(rows).to.have.length(0);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("deletes a project by name", function () {
        return projectManager.createProject({name: "MyProject"})
            .then(() => projectManager.deleteProject("MyProject"))
            .then(() => db.allAsync("SELECT * FROM project WHERE id = 1"))
            .then((rows) => {
                expect(rows).to.have.length(0);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("gets project of a file", function () {
        return projectManager.createProject({name: "MyProject", root_directory: "/some/directory"})
            .then(() => projectManager.getProjectForFile("/some/directory/a_file"))
            .then((projectId) => {
                expect(projectId).to.equal(1);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("gets project of a file that is in the projects directory", function() {
        return projectManager.createProject({name: "MyProject"})
            .then(() => {
                const projectPath = path.join(homeDir, ".spark", "projects", "MyProject");
                const mockConfig = {};
                mockConfig[projectPath] = {"a_file": "This is a file."};
                mock(mockConfig);
            })
            .then(() => projectManager.getProjectForFile(path.join(homeDir, ".spark", "projects", "MyProject", "a_file")))
            .then((projectId) => {
                expect(projectId).to.equal(1);
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });
    });

    it("returns undefined for project of a file that does not exist", function() {
        return projectManager.createProject({name: "MyProject", root_directory: "/some/directory"})
            .then(() => projectManager.getProjectForFile("/some/directory/a_file_that_does_not_exist"))
            .then((projectId) => {
                expect(projectId).to.not.exist;
            })
            .catch((err) => {
                expect(err).to.not.exist;
            })
    });

    it("returns null for project of a file in a directory that does not exist", function() {
        return projectManager.createProject({name: "MyProject", root_directory: "/some/directory"})
            .then(() => projectManager.getProjectForFile("/some/other/directory/a_file"))
            .then((projectId) => {
                expect(projectId).to.not.exist;
            })
            .catch((err) => {
                expect(err).to.not.exist;
            });

    });
});
