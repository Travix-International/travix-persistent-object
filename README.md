# travix-persistent-object

[![NPM](https://nodei.co/npm/travix-persistent-object.png?compact=true)](https://nodei.co/npm/travix-persistent-object)

[![Build Status](https://travis-ci.org/Travix-International/travix-persistent-object.svg)](https://travis-ci.org/Travix-International/travix-persistent-object)
[![Code Climate](https://codeclimate.com/github/Travix-International/travix-persistent-object/badges/gpa.svg)](https://codeclimate.com/github/Travix-International/travix-persistent-object)
[![Test Coverage](https://codeclimate.com/github/Travix-International/travix-persistent-object/badges/coverage.svg)](https://codeclimate.com/github/Travix-International/travix-persistent-object/coverage)

An object wrapper for NodeJs that automatically (and asynchronously) saves content of an object to a JSON file as soon as the object has been modified.

> This implementation is much more efficient than any timer based change tracking mechanism because it is based on the [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) which was introduced in ESMAScript 2015.

* [Installation](#installation)
* [Usage](#usage)
* [Scripts](#scripts)
* [API](#api)
* [Spec](https://github.com/Travix-International/travix-persistent-object/blob/master/SPEC.md)

## Installation

Install it via [npm](https://npmjs.com):

```
$ npm install --save travix-persistent-object
```

> Since some features of ES2015 are heavily used by this module, it requires NodeJS 6.9 or higher.

## Usage

Example code:

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

Console output:

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

> persistentObject(path, ...options)

Creates new persistent object and returns promise eventually resolving to the object wrapped with proxy if it has been successfully loaded, or rejecting with error returned by `fs.readFile` otherwise.

### Arguments:
1. `path` (`String`): Path to the file to load object from and to save it to. Should be not empty string;
2. `[options]` (`Function`|`Number`|`Object`): Arbitrary duck-typed combination of depth, prototype and watcher arguments:
  * `[depth=0]`: Depth to track changes on (how deep nested object are recursively prozied). Zero means unlimited depth.
  * `[prototype={}]`: Object to use by default when path points to non-existing file. Can be any sort of object. If a function passed to this argument, it is considered to be a `watcher`.
  * `[watcher]`: Function to be called each time the object has been saved or  attempt to save has failed. Accepts two arguments:
    * `[error]`: Error returned by `fs.writeFile` if any, or `null`,
    * `[proxy]`: Proxy initially returned by `persistentObject`.

The returned proxy will track the following operations for the wrapped object and all the nested objects (depending on `depth` option):
* delete:
  - `delete object.property`
  - `delete object.child.property`
* defineProperty:
  - `Object.defineProperty(object, 'property', { value: 42 })`
  - `Object.defineProperty(object.child, 'property', { value: 42 })`
* set:
  - `object.property = 42`
  - `object.child.property = 42`

> If any nested object contains readonly enumerable property, proxying will fail with "Property ${key} cannot be proxied" error.

# License

MIT © [Travix International](http://travix.com)
