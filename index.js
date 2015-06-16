'use strict';
var Joi = require('joi');
var fs = require('fs-extra');
var _ = require('lodash');
//var validator = require('is-my-json-valid');


var confSchema = Joi.object().keys({
    schema: [Joi.string().min(2).description('json-schema file path'), Joi.object().description('json-schema content')],
});

var isSchemaFile = function(value) {
    return _.isString(value);
};

var isSchemaContent = function(value) {
    return _.isPlainObject(value);
};

var loadSchema = function(value) {
    if (isSchemaContent(value)) {
        return value;
    } else
    if (isSchemaFile(value)) {
        return fs.readJsonSync(value);
    } else {
        throw new Error("Unknown schema " + value);
    }
};


module.exports = function(config) {
    Joi.assert(config, confSchema);
    var schema = loadSchema(config.schema);

    var commander = {
        schema: schema
    };

    return commander;

};