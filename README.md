#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

> Commands generator for the update of json documents

This library provides some commands for manipulating a json configuration file. 
This configuration file must respect a json-schema.

## Install

```sh
$ npm install --save json-commander
```


## Usage

```js
var jsonCommander = require('json-commander');
var cmdr = jsonCommander({schema: __dirname + "myschema.json"});

var someJson = {
	title: "Some title",
	contributors: [
		{name: "Olivier"},
		{name: "Aradhna"},
		{name: "Roy"}
	]
	};

    cmdr.evaluate(someJson, ['get', 'contributors[1].name']);
    //will return Aradhna
```

### Help

Display the help for the supported commands.

```js
	cmdr.evaluate(someJson, ['help']);
	//Will return some help

```

### All

Display the new configuration.

```js
	cmdr.evaluate(someJson, ['all');
	//will return someJson
```

### Check

Check whether the configuration is valid or not.

```js
	cmdr.evaluate(someJson, ['check']);
	//will return valid or invalid
```


### Copy

Copy a value between two paths.

```js
	cmdr.evaluate(someJson, ['copy', 'contributors[1]', 'contributors[2]']);
	//will replace Roy by olivier
```


### Del

Delete the value at the given path.

```js
	cmdr.evaluate(someJson, ['del', 'contributors[2]']);
	//will delete Roy
```


### Get

Get the value at the given path.

```js
	cmdr.evaluate(someJson, ['get', 'title']);
	//will return "Some title"
```


### Insert

Insert a blank row.

```js
	cmdr.evaluate(someJson, ['insert', 'contributors','1']);
	//will insert an empty contributor after Aradhna
```

### Set

Set the value at the given path.

```js
	cmdr.evaluate(someJson, ['set', 'title','Much better title']);
	//Will replace 'Some title' by 'Much better title'
```

### Schema

Display the schema with all the possible paths.

```js
	cmdr.evaluate(someJson, ['schema']);
	//Will display the schema
```


## License

MIT © [Olivier Huin]()


[npm-url]: https://npmjs.org/package/json-commander
[npm-image]: https://badge.fury.io/js/json-commander.svg
[travis-url]: https://travis-ci.org/flarebyte/json-commander
[travis-image]: https://travis-ci.org/flarebyte/json-commander.svg?branch=master
[daviddm-url]: https://david-dm.org/flarebyte/json-commander.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/flarebyte/json-commander
