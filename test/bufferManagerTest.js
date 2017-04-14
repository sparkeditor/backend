const expect = require("chai").expect;
const BufferManager = require("../lib/bufferManager");

describe("Buffer Manager", function() {
    beforeEach(function() {
        BufferManager.createBuffer("testBuffer", "This is a test.");
    });

    afterEach(function() {
        BufferManager.deleteBuffer("testBuffer");
    });

    it("creates an empty buffer", function() {
        const buf = BufferManager.createBuffer("testBuffer1");
        expect(buf).to.exist;
        expect(buf).to.respondTo("insert");
        expect(buf).to.respondTo("delete");
        expect(buf).to.respondTo("getSequence");
        expect(buf).to.respondTo("stringAt");
        expect(buf.getSequence()).to.be.empty;
        BufferManager.deleteBuffer("testBuffer1");
    });

    it("creates a buffer with content", function() {
        const buf = BufferManager.createBuffer(
            "testBuffer1",
            "This is another test."
        );
        expect(buf).to.exist;
        expect(buf).to.respondTo("insert");
        expect(buf).to.respondTo("delete");
        expect(buf).to.respondTo("getSequence");
        expect(buf).to.respondTo("stringAt");
        expect(buf.getSequence()).to.equal("This is another test.");
        BufferManager.deleteBuffer("testBuffer1");
    });

    it("throws an error on an attempt to create existing buffer", function() {
        expect(
            BufferManager.createBuffer.bind(BufferManager, "testBuffer")
        ).to.throw(Error);
    });

    it("gets an existing buffer", function() {
        const buf = BufferManager.getBuffer("testBuffer");
        expect(buf).to.exist;
        expect(buf).to.respondTo("insert");
        expect(buf).to.respondTo("delete");
        expect(buf).to.respondTo("getSequence");
        expect(buf).to.respondTo("stringAt");
        expect(buf.getSequence()).to.equal("This is a test.");
    });

    it("does not get a nonexistant buffer", function() {
        const buf = BufferManager.getBuffer("testBuffer1");
        expect(buf).to.not.exist;
    });

    it("deletes a buffer", function() {
        BufferManager.deleteBuffer("testBuffer");
        const buf = BufferManager.getBuffer("testBuffer");
        expect(buf).to.not.exist;

        // Recreate the buffer to avoid an error
        BufferManager.createBuffer("testBuffer");
    });

    it("throws an error on an attempt to delete nonexistant buffer", function() {
        expect(
            BufferManager.deleteBuffer.bind(BufferManager, "testBuffer1")
        ).to.throw(Error);
    });
});
