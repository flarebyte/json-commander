/*global describe, it */
'use strict';
var assert = require('chai').assert;
var jsonCommander = require('../');
var fs = require('fs-extra');
var _ = require('lodash');

var basicConf = {
    schema: __dirname + "/fixtures/pack.schema.json"
};


var lodashExample = fs.readJsonSync(__dirname + "/fixtures/lodash.json");

var newExample = function() {
    return _.cloneDeep(lodashExample);
};

describe('json-commander node module', function() {
    it('must be load schema', function() {
        var cmdr = jsonCommander(basicConf);
        assert.isNotNull(cmdr);
        assert.isNotNull(cmdr.schema);
    });

    it('must build a model', function() {
        var cmdr = jsonCommander(basicConf);
        var model = cmdr.model();
        console.log(model);
    });

    it('must validate a valid path', function() {
        var cmdr = jsonCommander(basicConf);
        assert.isTrue(cmdr.isPathValid('author.name'), 'author.name');
        assert.isTrue(cmdr.isPathValid('keywords[2]'), 'keywords[2]');
        assert.isTrue(cmdr.isPathValid('version'), 'version');
        assert.isTrue(cmdr.isPathValid('contributors[3].name'), 'contributors[3].name');
        assert.isFalse(cmdr.isPathValid('contributors[].name'), 'contributors[].name');
        assert.isFalse(cmdr.isPathValid('contributors[a].name'), 'contributors[a].name');
        assert.isFalse(cmdr.isPathValid('anything'), 'anything');
    });

    it('must read json data', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        assert.equal(cmdr.getValue(ex, 'name'), 'lodash', 'name');
        assert.equal(cmdr.getValue(ex, 'contributors[0].name'), 'John-David Dalton', 'contributors[0].name');
        assert.equal(cmdr.getValue(ex, 'repository.type'), 'git', 'repository.type');
        assert.equal(cmdr.getValue(ex, 'keywords[1]'), 'stdlib', 'keywords[1]');
        assert.instanceOf(cmdr.getValue(ex, 'sillyPath'), Error, 'should be error');
        assert.isUndefined(cmdr.getValue(ex, 'keywords[10]'), 'keyword out of bound');
        assert.isUndefined(cmdr.getValue(ex, 'contributors[100].name'), 'contributor out of bound');
    });

    it('must extract parent path', function() {
        var cmdr = jsonCommander(basicConf);
        assert.isNull(cmdr.getParentPath('a'), 'no parent');
        assert.equal(cmdr.getParentPath('a.b'), 'a', 'parent of a.b');
        assert.equal(cmdr.getParentPath('a.b.c.d'), 'a.b.c', 'parent of a.b.c.d');
        assert.equal(cmdr.getParentPath('a[7]'), 'a', 'parent of a[7]');
        assert.equal(cmdr.getParentPath('a.b[12]'), 'a.b', 'parent of a.b[12]');
        assert.equal(cmdr.getParentPath('a.b[3].c'), 'a.b[3]', 'parent of a.b[3].c');
        assert.equal(cmdr.getParentPath('a.b[3].c[100]'), 'a.b[3].c', 'parent of a.b[3].c[100]');
    });

    it('must check if a value is valid', function() {
        var cmdr = jsonCommander(basicConf);
        assert.isTrue(cmdr.isValueValid('name', "myName").valid, 'simple string');
        assert.isFalse(cmdr.isValueValid('name', null).valid, 'null is not valid');
        assert.isFalse(cmdr.isValueValid('name', 12).valid, 'null is not valid');
        assert.isTrue(cmdr.isValueValid('author', {
            any: 'really'
        }).valid, 'an object possibly incorrect');
        assert.isFalse(cmdr.isValueValid('author', 'baudelaire').valid, 'a string instead of object');
        assert.isTrue(cmdr.isValueValid('anyNumber', 12.4).valid, 'a number');
        assert.isTrue(cmdr.isValueValid('anyNumber', "100.8").valid, 'a number passed as string');
        assert.isFalse(cmdr.isValueValid('anyNumber', 'notANumber').valid, 'not a number');
        assert.isTrue(cmdr.isValueValid('anyInteger', 12).valid, 'an integer');
        assert.isTrue(cmdr.isValueValid('anyInteger', "100").valid, 'an integer passed as string');
        assert.isFalse(cmdr.isValueValid('anyInteger', 'notAnInteger').valid, 'not an integer');
        assert.isTrue(cmdr.isValueValid('anyBoolean', true).valid, 'a boolean');
        assert.isTrue(cmdr.isValueValid('anyBoolean', "no").valid, 'a boolean as string');
        assert.isTrue(cmdr.isValueValid('anyBoolean', "yes").valid, 'a boolean as string');
        assert.isFalse(cmdr.isValueValid('anyBoolean', {}).valid, 'not a boolean');

    });


    it('must set json data', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        cmdr.setValue(ex, 'name', 'newName');
        cmdr.setValue(ex, 'contributors[0].name', 'newContributorName');
        cmdr.setValue(ex, 'repository.type', 'newRepoType');
        cmdr.setValue(ex, 'keywords[1]', 'newKeyword');
        cmdr.setValue(ex, 'anyNumber', '12.4');
        cmdr.setValue(ex, 'anyInteger', '240');
        cmdr.setValue(ex, 'anyBoolean', 'yes');

        assert.equal(ex.name, 'newName', 'newName');
        assert.equal(ex.contributors[0].name, 'newContributorName', 'contributors[0].name');
        assert.equal(ex.repository.type, 'newRepoType', 'repository.type');
        assert.equal(ex.keywords[1], 'newKeyword', 'keywords[1]');
        assert.equal(ex.anyNumber, 12.4, 'any number');
        assert.equal(ex.anyInteger, 240, 'any integer');
        assert.isTrue(ex.anyBoolean, 'any boolean');

        assert.instanceOf(cmdr.setValue(ex, 'sillyAttribute', 'newKeyword'), Error, 'should be error');
        assert.instanceOf(cmdr.setValue(ex, 'contributors[10].name', 'newName'), Error, 'should be error');
    });


});