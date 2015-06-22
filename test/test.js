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

var isError = function(value, msg) {
    assert.isTrue(_.isError(value), msg);
};

var isNotError = function(value, msg) {
    assert.isFalse(_.isError(value), msg);
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
        assert.isObject(model);
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

    it('must insert head row', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        var err = cmdr.insertRow(ex, 'contributors', 0);
        isNotError(err, err);
        assert.isObject(ex.contributors[0], 'head contributor');
        assert.isUndefined(ex.contributors[0].name);
        assert.equal(ex.contributors.length, 6, 'number of contributors');

        cmdr.insertRow(ex, 'keywords', 0);
        assert.isString(ex.keywords[0], 'head keyword');
        assert.equal(ex.keywords.length, 4, 'number of keywords');
        assert.equal(ex.keywords[0], '');
    });

    it('must insert row in middle of array', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        cmdr.insertRow(ex, 'contributors', 1);
        assert.isObject(ex.contributors[1], 'head contributor');
        assert.isUndefined(ex.contributors[1].name);
        assert.equal(ex.contributors.length, 6, 'number of contributors');

        cmdr.insertRow(ex, 'keywords', 1);
        assert.isString(ex.keywords[1], 'head keyword');
        assert.equal(ex.keywords[1], '');
        assert.equal(ex.keywords.length, 4, 'number of keywords');
    });

    it('must insert tail row', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        cmdr.insertRow(ex, 'contributors', -1);
        assert.isObject(ex.contributors[5], 'tail contributor');
        assert.isUndefined(ex.contributors[5].name);
        assert.equal(ex.contributors.length, 6, 'number of contributors');

        cmdr.insertRow(ex, 'keywords', -1);
        assert.isString(ex.keywords[3], 'head keyword');
        assert.equal(ex.keywords[3], '');
        assert.equal(ex.keywords.length, 4, 'number of keywords');
    });

    it('must insert two rows up from the tail', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        cmdr.insertRow(ex, 'contributors', -2);
        assert.isObject(ex.contributors[4], 'tail contributor');
        assert.isUndefined(ex.contributors[4].name);
        assert.equal(ex.contributors.length, 6, 'number of contributors');

        cmdr.insertRow(ex, 'keywords', -2);
        assert.isString(ex.keywords[2], 'head keyword');
        assert.equal(ex.keywords[2], '');
        assert.equal(ex.keywords.length, 4, 'number of keywords');
    });
    /*
    "contributors": [
      "name": "John-David Dalton",0
      "name": "Benjamin Tan",1
      "name": "Blaine Bublitz",2
      "name": "Kit Cambridge",3
      "name": "Mathias Bynens",4
    }

    "keywords": [
        "modules",0
        "stdlib",1
        "util",2
    ],
    */

    it('must copy value', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        isNotError(cmdr.copyValue(ex, 'contributors[2]', 'contributors[1]'));
        assert.equal(ex.contributors.length, 5, 'number of contributors');
        assert.equal(ex.contributors[0].name, 'John-David Dalton');
        assert.equal(ex.contributors[1].name, 'Blaine Bublitz');
        assert.equal(ex.contributors[2].name, 'Blaine Bublitz');
        assert.equal(ex.contributors[3].name, 'Kit Cambridge');
        assert.equal(ex.contributors[4].name, 'Mathias Bynens');

        isNotError(cmdr.copyValue(ex, 'keywords[1]', 'keywords[0]'));
        assert.equal(ex.keywords.length, 3, 'number of keywords');
        assert.equal(ex.keywords[0], 'stdlib');
        assert.equal(ex.keywords[1], 'stdlib');
        assert.equal(ex.keywords[2], 'util');

        isNotError(cmdr.copyValue(ex, 'contributors[4].name', 'keywords[2]'));
        assert.equal(ex.keywords.length, 3, 'number of keywords');
        assert.equal(ex.keywords[0], 'stdlib');
        assert.equal(ex.keywords[1], 'stdlib');
        assert.equal(ex.keywords[2], 'Mathias Bynens');

    });

    it('must not copy incompatible value', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();

        var err = cmdr.copyValue(ex, 'contributors[4]', 'keywords[2]');
        isError(err, err);


    });

    it('must delete item', function() {
        var cmdr = jsonCommander(basicConf);
        var ex = newExample();
        cmdr.deleteValue(ex, 'name');
        assert.isUndefined(ex.name);

        cmdr.deleteValue(ex, 'contributors[0].name');
        assert.isUndefined(ex.contributors[0].name);

        cmdr.deleteValue(ex, 'repository.type');
        assert.isUndefined(ex.repository.type);

        cmdr.deleteValue(ex, 'keywords[1]');
        assert.equal(ex.keywords[1],'util');
    });


});