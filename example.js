/* global Promise */
/* eslint no-console: "off" */

'option strict';

const persistent = require('./');

const delay = value => new Promise(
  resolve => setTimeout(() => resolve(value), 10)
);

const watcher = (error, object) => (
  error
    ? console.log('Fail: ', error.message)
    : console.log('Save:', object)
);

let i = 0;

const test = () => persistent('~example.tmp', watcher)
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
