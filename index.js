'use strict';
var Joi = require('joi');
var fs = require('fs-extra');
var _ = require('lodash');
var S = require('string');

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

var hasProperties = function(obj) {
    return (!_.isEmpty(obj.properties)) && ("object" === obj.type);
};

var hasItems = function(obj) {
    return (!_.isEmpty(obj.items)) && ("array" === obj.type);
};

var addPath = function(parent, child) {
    var childPath = _.clone(parent);
    childPath.push(child);
    return childPath;

};

var isStringProvided = function(value) {
    if (!_.isString(value)) {
        return false;
    }
    return (value.length > 0);
};

var asPropertyKey = function(pathArray) {
    return pathArray.join(".").replace(".[]", "[]");
};

var copyProps = function(obj, name, pathArray) {
    var props = {
        name: name,
        type: obj.type,
        path: pathArray
    };
    if (isStringProvided(obj.title)) {
        props.title = obj.title;
    }
    if (isStringProvided(obj.description)) {
        props.description = obj.description;
    }

    return props;
};


var walkPaths = function(obj, pathsFound, parentPath) {
    if (hasProperties(obj)) {

        _.forIn(obj.properties, function(v, k) {
            var propPath = addPath(parentPath, k);
            pathsFound[asPropertyKey(propPath)] = copyProps(v, k, propPath);
            walkPaths(v, pathsFound, propPath);

        });
    } else
    if (hasItems(obj)) {
        var arrayPath = addPath(parentPath, "[]");
        pathsFound[asPropertyKey(arrayPath)] = copyProps(obj.items, "[]", arrayPath);
        if (hasProperties(obj.items)) {

            _.forIn(obj.items.properties, function(v, k) {
                var propPath = addPath(arrayPath, k);
                pathsFound[asPropertyKey(propPath)] = copyProps(v, k, propPath);
                walkPaths(v, pathsFound, propPath);

            });
        }

    } else {
        //console.log("already processed?"+JSON.stringify(obj));
    }
};

var simplifyPath = function(value) {
    return value.replace(/\[\d+\]/g, "[]");
};

var getParentPath = function(path) {
    var p = S(path);
    var hasParent = p.contains('.') || p.contains('[');
    if (!hasParent) {
        return null;
    }

    if (p.endsWith(']')) {
        return path.replace(/\[\d+\]$/, '');
    }

    return path.replace(/(\.[^.]+$)/, '');
};

module.exports = function(config) {
    Joi.assert(config, confSchema);
    var schema = loadSchema(config.schema);
    var pathsFound = {};
    walkPaths(schema, pathsFound, []);

    var idPathValid = function(path) {
        var isSyntaxCorrect = (!isStringProvided(path)) || (path.indexOf('[]') >= 0);
        if (isSyntaxCorrect) {
            return false;
        }
        var search = simplifyPath(path);
        return _.has(pathsFound, search);
    };

    var getTypeForPath = function(path) {
        return pathsFound[simplifyPath(path)].type;
    };

    var isValueValid = function(path, value) {
        var valueType = getTypeForPath(path);
        var invalid = {
            valid: false,
            expected: valueType
        };
        if (_.isNull(value) || _.isUndefined(value)) {
            return invalid;
        }
        if ((valueType === "string") && (!_.isString(value))) {
            return invalid;
        }

        if ((valueType === "object") && (!_.isObject(value))) {
            return invalid;
        }

        if ((valueType === "array") && (!_.isArray(value))) {
            return invalid;
        }

        var s = S(value);

        if (valueType === "boolean") {

            if (isStringProvided(value)) {
                var valueLower = value.toLowerCase();
                var isBoolean = valueLower === 'true' || valueLower === 'false' || valueLower === 'yes' || valueLower === 'no' || valueLower === 'on' || valueLower === 'off';
                if (!isBoolean) {
                    return invalid;
                }
            } else if (!_.isBoolean(value)) {
                return invalid;
            }

        }

        if (valueType === "number") {

            if (isStringProvided(value)) {
                if (!_.isFinite(s.toFloat())) {
                    return invalid;
                }
            } else if (!_.isNumber(value)) {
                return invalid;
            }
        }

        if (valueType === "integer") {

            if (isStringProvided(value)) {
                if (!_.isFinite(s.toInt())) {
                    return invalid;
                }
            } else if (!_.isNumber(value)) {
                return invalid;
            }
        }


        return {
            valid: true,
            expected: valueType
        };
    };

    var getValue = function(jsonData, path) {
        var isValid = idPathValid(path);
        if (!isValid) {
            return new Error('Given path is not valid:' + path);
        }
        return _.get(jsonData, path);
    };

    var setValueForType = function(jsonData, path, value) {
        var childType = getTypeForPath(path);
        switch (childType) {
            case 'integer':
                _.set(jsonData, path, S(value).toInt());
                break;
            case 'number':
                _.set(jsonData, path, S(value).toFloat());
                break;
            case 'boolean':
                _.set(jsonData, path, S(value).toBoolean());
                break;
            default:
                _.set(jsonData, path, value);

        }

    };

    var createEmpty = function(valueType) {
        var value = "";
        switch (valueType) {
            case 'integer':
                value = 0;
                break;
            case 'number':
                value = 0;
                break;
            case 'string':
                value = "";
                break;
            case 'object':
                value = {};
                break;
            default:
                throw new Error(valueType + 'not supported!');

        }

        return value;

    };

    var setValue = function(jsonData, path, value) {
        var isValid = idPathValid(path);
        if (!isValid) {
            return new Error('Given path is not valid');
        }
        var isValueNotValid = !isValueValid(path, value);
        if (isValueNotValid) {
            return new Error('Value is not valid for path');
        }
        var parent = getParentPath(path);
        if (_.isNull(parent)) {
            setValueForType(jsonData, path, value);
        } else {
            var parentType = getTypeForPath(parent);
            var isParentContainer = (parentType === 'object') || (parentType === 'array');
            if (!isParentContainer) {
                throw new Error('The parent should be a an object or an array');
            }
            var parentData = _.get(jsonData, path);
            var isUndefinedAndArray = _.isUndefined(parentData) && (parent.indexOf('[') >= 0);
            if (isUndefinedAndArray) {
                return new Error('The parent object should be defined');
            }

            setValueForType(jsonData, path, value);

            return jsonData;

        }
    };

    var insertRow = function(jsonData, path, position) {
        var isValid = idPathValid(path);
        if (!isValid) {
            return new Error('Given path is not valid');
        }
        var valueType = getTypeForPath(path);
        if (valueType !== 'array') {
            return new Error('This path is not array but ' + valueType);
        }

        var previousVal = _.get(jsonData, path);
        if (_.isEmpty(previousVal)) {
            previousVal = [];
        }
        var max = _.size(previousVal);
        var min = -max - 1;

        var pos = S(position).toInt();

        var inrange = pos >= min && pos <= max;
        if (!inrange) {
            return new Error('Position should be between ' + min + ' and ' + max);
        }
        var childType = getTypeForPath(path + "[]");
        if (pos === -1) {
            previousVal.push(createEmpty(childType));
        } else if (pos >= 0) {
            previousVal.splice(pos, 0, createEmpty(childType));
        } else if (pos < -1) {
            previousVal.splice(pos + 1, 0, createEmpty(childType));
        }

        _.set(jsonData, path, previousVal);

        return jsonData;

    };
    var copyValue = function(jsonData, pathSrc, pathDest) {
        var src = getValue(jsonData, pathSrc);
        if (_.isError(src)) {
            return src;
        }
        var typeSrc = getTypeForPath(pathSrc);
        var typeDest = getTypeForPath(pathDest);

        if (typeSrc !== typeDest) {
            return new Error('Source type is different from destination type: ' + typeSrc + ' and ' + typeDest);
        }

        setValue(jsonData, pathDest, src);
    };

    var deleteValue = function(jsonData, path) {
        var isValid = idPathValid(path);
        if (!isValid) {
            return new Error('Given path is not valid:' + path);
        }
        var parentPath = getParentPath(path);
        if (_.isNull(parentPath)) {
            delete jsonData[path];
        } else {
            var parentType = getTypeForPath(parentPath);
            var parentVal = _.get(jsonData, parentPath);
            if (parentType === 'object') {
                var childPath = S(path).chompLeft(parentPath + ".");
                delete parentVal[childPath];
            } else if (parentType === 'array') {
                var idx = S(path).chompLeft(parentPath).between('[',']').toInt();
                _.pullAt(parentVal,idx);
            }


        }

    };



    var commander = {
        schema: schema,
        model: function() {
            return _.clone(pathsFound);
        },
        isPathValid: idPathValid,
        isValueValid: isValueValid,
        getParentPath: getParentPath,
        getValue: getValue,
        setValue: setValue,
        insertRow: insertRow,
        copyValue: copyValue,
        deleteValue: deleteValue
    };

    return commander;

};