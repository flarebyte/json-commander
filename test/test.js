/*global describe, it */
'use strict';
var assert = require('chai').assert;
var jsonCommander = require('../');

var basicConf = {
    schema: __dirname + "/fixtures/pack.schema.json"
};

describe('json-commander node module', function() {
    it('must be load schema', function() {
        var cmdr = jsonCommander(basicConf);
        assert.isNotNull(cmdr);
        assert.isNotNull(cmdr.schema);
    });
});