# travix-persistent-object

[![npm](https://img.shields.io/npm/v/travix-persistent-object.svg)](https://www.npmjs.com/package/travix-persistent-object)
[![Build Status](https://img.shields.io/travis/Travix-International/travix-persistent-object/master.svg)](https://travis-ci.org/Travix-International/travix-persistent-object)
[![Code Climate](https://img.shields.io/codeclimate/github/Travix-International/travix-persistent-object.svg)](https://codeclimate.com/github/Travix-International/travix-persistent-object)
[![Test Coverage](https://img.shields.io/codeclimate/coverage/github/Travix-International/travix-persistent-object.svg)](https://codeclimate.com/github/Travix-International/travix-persistent-object/coverage)
[![Issues](https://img.shields.io/codeclimate/issues/github/Travix-International/travix-persistent-object.svg)](https://codeclimate.com/github/Travix-International/travix-persistent-object/issues)

An object wrapper for NodeJs that automatically (and asynchronously) saves content of an object to a JSON file as soon as the object has been modified.

> This implementation is much more efficient than any timer based change tracking mechanism because it is based on the [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which was introduced in ESMAScript 2015.

* [Installation](#installation)
* [Usage](#usage)
* [Scripts] (#scripts)
* [API](#api)
* [Spec](https://github.com/Travix-International/travix-persistent-object/blob/master/SPEC.md)

## Installation

Install it via [npm](https://npmjs.com):

```
$ npm install --save travix-persistent-object
```

> Since some features of ES2015 are heavily used by this module, it requires NodeJS 6.9 or higher.

## Usage

```js
const { random } = Math;
const persistent = require('travix-persistent-object');

const delay = value => new Promise(
  resolve => setTimeout(() => resolve(value), 10)
);

const watcher = (error, object) => (
  error
    ? console.log('Fail: ', error.message)
    : console.log('Save:', object)
);

let i = 0;

const test = () => persistent('path/to/object.json', watcher)
  .then(object => {
    console.log('Load:', object);
    object.value = ++i;
    console.log('Set value:', i);
    return object;
  })
  .then(delay)
  .then(object => {
    Object.defineProperty(object, 'property', {
      configurable: true, enumerable: true, value: ++i
    });
    console.log('Define property:', i);
    return object;
  })
  .then(delay)
  .then(object => {
    object.array = [];
    object.array.push(++i);
    console.log('Create array with item:', i);
    return object;
  })
  .then(delay)
  .then(object => {
    object.array.length = 0;
    console.log('Clear array');
    return object;
  })
  .then(delay)
  .then(object => {
    delete object.array;
    delete object.property;
    delete object.value;
    console.log('Delete all properies');
    return object;
  });

test().then(delay).then(test);
```

Example output:

```text
Load: {}
Set value: 1
Save: { value: 1 }
Define property: 2
Save: { value: 1, property: 2 }
Create array with item: 3
Save: { value: 1, property: 2, array: [ 3 ] }
Clear array
Save: { value: 1, property: 2, array: [] }
Delete all properies
Save: {}

Load: {}
Set value: 4
Save: { value: 4 }
Define property: 5
Save: { value: 4, property: 5 }
Create array with item: 6
Save: { value: 4, property: 5, array: [ 6 ] }
Clear array
Save: { value: 4, property: 5, array: [] }
Delete all properies
Save: {}
```

## Scripts

To run linting of source code and unit tests:

```
$ npm run lint
```

To run unit tests and generate coverage report:

```
$ npm run test
```

To generate [SPEC.md](https://github.com/Travix-International/travix-persistent-object/blob/master/SPEC.md) file from test specifications:

```
$ npm run spec
```

## API

> persistentObject(path, prototype, watcher)

Creates new persistent object and returns promise eventually resolving to the object wrapped with proxy if it has been successfully loaded, or rejecting with error returned by `fs.readFile` otherwise.

### Arguments:
1. `path` (`String`): Path to the file to load object from and to save it to. Should be not empty string;
2. `[prototype]` (`Object`): Object to use by default when path points to not existing file. Can be any sort of object. If a function passed to this argument, it is considered as `watcher` function;
3. `[watcher]` (`Function`): Function to be invoked every time when the object has been saved or when attempt to save has failed. Watcher function should accept two arguments:
  * `[error]` (`Error`): Error returned by `fs.writeFile` function if any, or `null`,
  * `[proxy]` (`Proxy`): Proxy wrapper initially returned by `persistentObject` function.

The returned proxy will track the following operations for the wrapped object and all the nested objects (that are in turn also recursively proxied):
* delete: `delete object.test`,
* defineProperty: `Object.defineProperty(object, 'test', { value: 42 })`;
* set: `object.test = 42`.

If any nested object contains readonly enumerable property, proxying will fail with "Property ${key} cannot be proxied" error.

# License

MIT © [Travix International](http://travix.com)
