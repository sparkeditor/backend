const fs = require("fs");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const expect = require("chai").expect;
const fileIO = require("../lib/fileIO");

describe("FileIO", function() {
    const testDir = path.resolve(path.join(".", "._DELETE_ME"));

    beforeEach(function(done) {
        mkdirp(path.join(testDir, "dir1"), function() {
            fs.writeFile(
                path.join(testDir, "dir1", "file1"),
                "This is a test file.",
                done
            );
        });
    });

    afterEach(function(done) {
        rimraf(testDir, done);
    });

    it("reads from an existing file asynchronously", function() {
        return fileIO.read(path.join(testDir, "dir1", "file1")).then(data => {
            expect(data).to.equal("This is a test file.");
        });
    });

    it("returns an error from an asynchronous read of a nonexistant file", function() {
        return fileIO
            .read(path.join(testDir, "dir2", "file1"))
            .then(data => {
                expect(data).to.not.exist;
            })
            .catch(err => {
                expect(err).to.exist;
            });
    });

    it("overwrites an existing file asynchronously", function() {
        return fileIO
            .write(path.join(testDir, "dir1", "file1"), "Different text.")
            .then(() =>
                fs.readFileSync(path.join(testDir, "dir1", "file1"), "utf8")
            )
            .then(text => {
                expect(text).to.equal("Different text.");
            });
    });

    it("writes a new file asynchronously", function() {
        return fileIO
            .write(path.join(testDir, "dir1", "file2"), "Some more text.")
            .then(() =>
                fs.readFileSync(path.join(testDir, "dir1", "file2"), "utf8")
            )
            .then(text => {
                expect(text).to.equal("Some more text.");
            });
    });

    it("creates a new directory asynchronously", function() {
        return fileIO
            .createDir(path.join(testDir, "dir2"))
            .then(() => fs.accessSync(path.join(testDir, "dir2")));
    });

    it("creates a new directory implicitly from a path passed to write()", function() {
        return fileIO
            .write(path.join(testDir, "dir2", "file1"), "File text.")
            .then(() => fs.accessSync(testDir, "dir2"));
    });

    it("fails silently trying to create an existing directory asynchronously", function() {
        return fileIO.createDir(path.join(testDir, "dir1"));
    });

    it("deletes a file asynchronously", function() {
        return fileIO
            .delete(path.join(testDir, "dir1", "file1"))
            .then(() => fs.accessSync(path.join(testDir, "dir1", "file1")))
            .catch(err => {
                expect(err.code).to.equal("ENOENT");
            });
    });

    it("deletes a directory asynchronously", function() {
        return fileIO
            .delete(path.join(testDir, "dir1"))
            .then(() => fs.accessSync(path.join(testDir, "dir1")))
            .catch(err => {
                expect(err.code).to.equal("ENOENT");
            });
    });

    it("returns an error trying to asynchronously delete a file that does not exist", function() {
        return fileIO
            .delete(path.join(testDir, "dir1", "file2"))
            .then(() => {
                expect(new Error("Shouldn't reach this.")).to.not.exist;
            })
            .catch(err => {
                expect(err.code).to.equal("ENOENT");
            });
    });
});
