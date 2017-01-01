const fs = require("fs");
const expect = require("chai").expect;
const mock = require("mock-fs");

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

    it("reads from an existing file asynchronously", function(done) {
        fileIO.read("test/dir1/file1", function(error, data) {
            expect(error).to.not.exist;
            expect(data).to.equal("This is a test file.");
            done();
        });
    });

    it("reads from an existing file synchronously", function() {
        const data = fileIO.read("test/dir1/file1");
        expect(data).to.equal("This is a test file.");
    });

    it("returns an error from an asynchronous read of a nonexistant file", function(done) {
        fileIO.read("test/dir2/file1", function(error, data) {
            expect(error).to.exist;
            expect(data).to.not.exist;
            done();
        });
    });

    it("throws an error from a synchronous read of a nonexistant file", function() {
        expect(fileIO.read.bind(fileIO, "test/dir2/file1")).to.throw(Error);
    });

    it("overwrites an existing file synchronously", function(done) {
        fileIO.write("test/dir1/file1", "Different text.");
        fs.readFile("test/dir1/file1", "utf8", function(error, data) {
            expect(error).to.be.null;
            expect(data).to.equal("Different text.");
            done();
        });
    });

    it("overwrites an existing file asynchronously", function(done) {
        fileIO.write("test/dir1/file1", "Different text.", function(error) {
            expect(error).to.not.exist;
            fs.readFile("test/dir1/file1", "utf8", function(err, text) {
                expect(err).to.not.exist;
                expect(text).to.equal("Different text.");
                done();
            });
        });
    });

    it("writes a new file synchronously", function(done) {
        fileIO.write("test/dir1/file2", "Some more text.");
        fs.readFile("test/dir1/file2", "utf8", function(error, data) {
            expect(error).to.not.exist;
            expect(data).to.equal("Some more text.");
            done();
        });
    });

    it("writes a new file asynchronously", function(done) {
        fileIO.write("test/dir1/file2", "Some more text.", function(error) {
            expect(error).to.not.exist;
            fs.readFile("test/dir1/file2", "utf8", function(err, text) {
                expect(err).to.not.exist;
                expect(text).to.equal("Some more text.");
                done();
            });
        });
    });

    it("creates a new directory asynchronously", function(done) {
        fileIO.createDir("test/dir2", function(error)  {
            expect(error).to.not.exist;
            fs.access("test/dir2", function(error) {
                expect(error).to.not.exist;
                done();
            });
        });
    });

    it("creates a new directory synchronously", function(done) {
        fileIO.createDir("test/dir2");
        fs.access("test/dir2", function(error) {
            expect(error).to.not.exist;
            done();
        });
    });

    it("creates a new directory implicitly from a path passed to write()", function(done) {
        fileIO.write("test/dir2/file1", "File text.");
        fs.access("test/dir2", function(error) {
            expect(error).to.not.exist;
            done();
        });
    });

    it("returns an error trying to create an existing directory asynchronously", function(done) {
        fileIO.createDir("test/dir1", function(error) {
            expect(error).to.exist;
            expect(error.code).to.equal("EEXIST");
            done();
        });
    });

    it("throws an error trying to create an existing directory synchronously", function() {
        expect(fileIO.createDir.bind(fileIO, "test/dir1")).to.throw("EEXIST");
    });

    it("deletes a file synchronously", function(done) {
        fileIO.delete("test/dir1/file1");
        fs.access("test/dir1/file1", function(error) {
            expect(error.code).to.equal("ENOENT");
            done();
        });
    });

    it("deletes a file asynchronously", function(done) {
        fileIO.delete("test/dir1/file1", function(error) {
            expect(error).to.not.exist;
            fs.access("test/dir1/file1", function(err) {
                expect(err.code).to.equal("ENOENT");
                done();
            });
        });
    });

    it("deletes a directory synchronously", function(done) {
        fileIO.delete("test/dir1");
        fs.access("test/dir1", function(error) {
            expect(error.code).to.equal("ENOENT");
            done();
        });
    });

    it("deletes a directory asynchronously", function(done) {
        fileIO.delete("test/dir1", function(error) {
            expect(error).to.not.exist;
            fs.access("test/dir1", function(err) {
                expect(err.code).to.equal("ENOENT");
                done();
            });
        });
    });

    it("returns an error trying to asynchronously delete a file that does not exist", function(done) {
        fileIO.delete("test/dir1/file2", function(error) {
            expect(error.code).to.equal("ENOENT");
            done();
        });
    });

    it("throws an error trying to synchronously delete a file that does not exist", function() {
        expect(fileIO.delete.bind(fileIO, "test/dir1/file2")).to.throw("ENOENT");
    });
});