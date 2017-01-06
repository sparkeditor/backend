const expect = require("chai").expect;
const mock = require("mock-fs");
const ConfigurationManager = require("../lib/configurationManager");

describe("ConfigurationManager", function() {
    beforeEach(function() {
        mock({
            ".spark": '{ "testKey1": "testValue1", "testKey2": "testValue2" }',
            "badJSON": '{ this is not json '
        });
    });

    afterEach(function() {
        mock.restore();
    });

    it("constructs a new ConfigurationManager with valid config path", function() {
        const configurationManager = new ConfigurationManager(".spark");
        expect(configurationManager).to.exist;
        expect(configurationManager).to.respondTo("getValue");
    });

    it("constructs a new ConfigurationManager with invalid config path", function() {
        const configurationManager = new ConfigurationManager("doesNotExist");
        expect(configurationManager).to.exist;
        expect(configurationManager).to.respondTo("getValue");
    });

    it("constructs a new ConfigurationManager with bad config file", function() {
        const configurationManager = new ConfigurationManager("badJSON");
        expect(configurationManager).to.exist;
        expect(configurationManager).to.respondTo("getValue");
    });

    it("gets valid values from the config file", function() {
        const configurationManager = new ConfigurationManager(".spark");
        const value1 = configurationManager.getValue("testKey1");
        const value2 = configurationManager.getValue("testKey2");
        expect(value1).to.equal("testValue1");
        expect(value2).to.equal("testValue2");
    });

    it("gets default values for non-existing config keys", function() {
        const configurationManager = new ConfigurationManager(".spark");
        const value = configurationManager.getValue("testKey3", "default");
        expect(value).to.equal("default");
    });

    it("gets original value if a default value is provided for a valid key", function() {
        const configurationManager = new ConfigurationManager(".spark");
        const value = configurationManager.getValue("testKey1", "default");
        expect(value).to.equal("testValue1");
    });

    it("gets an undefined value if no default is provided for non-existing keys", function() {
        const configurationManager = new ConfigurationManager(".spark");
        const value = configurationManager.getValue("testKey3");
        expect(value).to.be.undefined;
    });

    it("gets the default value for all getValue() calls to a ConfigurationManager with an invalid config file", function() {
        const configurationManager = new ConfigurationManager("doesNotExist");
        const value1 = configurationManager.getValue("testKey1", "default1");
        const value2 = configurationManager.getValue("testKey2", "default2");
        expect(value1).to.equal("default1");
        expect(value2).to.equal("default2");
    });

    it("gets the default value for all getValue() calls to a ConfigurationManager with a bad config file", function() {
        const configurationManager = new ConfigurationManager("badJSON");
        const value1 = configurationManager.getValue("testKey1", "default1");
        const value2 = configurationManager.getValue("testKey2", "default2");
        expect(value1).to.equal("default1");
        expect(value2).to.equal("default2");
    });

    it("caches config files", function() {
        let configurationManager = new ConfigurationManager(".spark");
        mock({
            ".spark": '{ "testKey1": "notTheSame", "testKey2": "stillNotTheSame" }'
        });
        configurationManager = new ConfigurationManager(".spark");
        const value1 = configurationManager.getValue("testKey1");
        const value2 = configurationManager.getValue("testKey2");
        expect(value1).to.equal("testValue1");
        expect(value2).to.equal("testValue2");
    });

    it("handles nested config objects", function() {
        mock({
            "nestedConfig": '{ "nested": { "nestedObject1": { "testKey": "testValue" }, "nestedObject2": { "testNested": { "testKey": "testValue" } } } }'
        });
        const configurationManager = new ConfigurationManager("nestedConfig");
        const nested = configurationManager.getValue("nested");
        expect(nested).to.deep.equal({
            nestedObject1: {
                testKey: "testValue"
            },
            nestedObject2: {
                testNested: {
                    testKey: "testValue"
                }
            }
        });
    });
});