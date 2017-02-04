const Promise = require("bluebird");
const fs = require("fs");
const expect = require("chai").expect;
const mock = require("mock-fs");

Promise.promisifyAll(fs);

const fileIO = require("../lib/fileIO");

describe("FileIO", function() {
    beforeEach(function() {
        mock({
            "test": {
                "dir1": {
                    "file1": "This is a test file."
                }
            }
        });
    });

    afterEach(function() {
        mock.restore();
    });

    it("reads from an existing file asynchronously", function() {
        return fileIO.read("test/dir1/file1")
            .then(function(data) {
                expect(data).to.equal("This is a test file.");
            })
            .catch(function(err) {
                expect(err).to.not.exist;
            });
        });
    });

    it("returns an error from an asynchronous read of a nonexistant file", function() {
        return fileIO.read("test/dir2/file1")
            .then(function(data) {
                expect(data).to.not.exist;
            })
            .catch(function(err) {
                expect(err).to.exist;
            });
    });

    it("overwrites an existing file asynchronously", function() {
        return fileIO.write("test/dir1/file1", "Different text.")
            .then(function() {
                return fs.readFileAsync("test/dir1/file1", "utf8")
            })
            .then(function(text) {
                expect(text).to.equal("Different text.");
            })
            .catch(function(err) {
                expect(err).to.not.exist;
            });
    });

    it("writes a new file asynchronously", function() {
        return fileIO.write("test/dir1/file2", "Some more text.")
            .then(function() {
                return fs.readFileAsync("test/dir1/file2", "utf8");
            })
            .then(function(text) {
                expect(text).to.equal("Some more text.");
            })
            .catch(function(err) {
                expect(err).to.not.exist;
            });
    });

    it("creates a new directory asynchronously", function() {
        return fileIO.createDir("test/dir2")
            .then(function() {
                return fs.accessAsync("test/dir2");
            })
            .catch(function(err) {
                expect(err).to.not.exist;
            });
    });

    it("creates a new directory implicitly from a path passed to write()", function() {
        return fileIO.write("test/dir2/file1", "File text.")
            .then(function() {
                return fs.accessAsync("test/dir2");
            })
            .catch(function(err) {
                expect(err).to.not.exist;
            });
    });

    it("fails silently trying to create an existing directory asynchronously", function() {
        return fileIO.createDir("test/dir1")
            .catch(function(err) {
                expect(error).to.not.exist;
            });
    });

    it("deletes a file asynchronously", function() {
        fileIO.delete("test/dir1/file1")
            .then(function() {
                return fs.accessAsync('test/dir1/file1');
            })
            .catch(function(err) {
                expect(err.code).to.equal("ENOENT");
            });
    });

    it("deletes a directory asynchronously", function() {
        fileIO.delete("test/dir1")
            .then(function() {
                return fs.accessAsync("test/dir1");
            })
            .catch(function(err) {
                expect(err.code).to.equal("ENOENT");
            });
    });

    it("returns an error trying to asynchronously delete a file that does not exist", function() {
        fileIO.delete("test/dir1/file2")
            .catch(function(err) {
                expect(error.code).to.equal("ENOENT");
            });
});