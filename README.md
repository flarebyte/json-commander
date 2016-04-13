#  [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-url]][daviddm-image]

> Commands generator for the update of json documents

This library provides some commands for manipulating a json configuration file.
This configuration file must respect a json-schema.

Because json-commander is aware of the schema, it is able to provide a smart assistance which can be pretty handy if you are implementing a CLI.

You can find at the bottom of this documentation, an example using the commander package, but json-commander is not tied to any specific CLI library.

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

### Creating a CLI

Json-commander can easily used to create a CLI.

Requires:
[commander](https://www.npmjs.com/package/commander)
[solace](https://www.npmjs.com/package/solace)
[confiture](https://www.npmjs.com/package/confiture)

The setup program:
```js
import solaceCreator from 'solace';
import confiture from 'confiture';

const solace = solaceCreator({});
const configurator = confiture({/*check doc*/});

const setupProgram = (cmd, other) => {
    const hasOther = !_.isEmpty(other);
    const cmdOptions = hasOther ? [cmd].concat(other) : [cmd];
    const isWriting = cmd === 'set' || cmd === 'copy' || cmd === 'del' || cmd === 'insert';
    if (isWriting) {
      cmdr.evaluate(unalteredConf, cmdOptions);
      configurator.saveSync(unalteredConf);
      solace.log(`${cmd} done.`);
    } else {
      const evaluation = cmdr.evaluate(unalteredConf, cmdOptions);
      solace.log(evaluation);
    }
  };
```

With commander to provide a CLI:
```js
import program from 'commander';
program.command('setup <cmd> [other...]')
  .description('configure My CLI')
  .action(setupProgram);
```


## License

MIT © [Olivier Huin]()


[npm-url]: https://npmjs.org/package/json-commander
[npm-image]: https://badge.fury.io/js/json-commander.svg
[travis-url]: https://travis-ci.org/flarebyte/json-commander
[travis-image]: https://travis-ci.org/flarebyte/json-commander.svg?branch=master
[daviddm-url]: https://david-dm.org/flarebyte/json-commander.svg?theme=shields.io
[daviddm-image]: https://david-dm.org/flarebyte/json-commander
