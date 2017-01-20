/* global Promise, Proxy */

'option strict';

const { readFile, writeFile } = require('fs');
const { nextTick } = process;
const { parse, stringify } = JSON;

module.exports = function persistent(path, prototype, watcher) {
  if (typeof path !== 'string' || !path.length)
    throw new TypeError('Argument "path" expected to be not empty string');

  if (typeof prototype === 'function') {
    watcher = prototype;
    prototype = {};
  }
  else if (prototype == null)
    prototype = {};
  else if (typeof prototype !== 'object')
    throw new TypeError('Argument "prototype" expected to be an object');

  if (watcher != null && typeof watcher !== 'function')
    throw new TypeError('Argument "watcher" expected to be a function');

  const CHANGED = 1, PENDING = 2;
  let object, state = 0;

  function load() {
    return new Promise((resolve, reject) => {
      readFile(path, (error, data) => {
        return error
          ? error.code === 'ENOENT'
            ? resolve(stringify(prototype))
            : reject(error)
          : resolve(data)
      })
    });
  }

  function save() {
    state &= ~CHANGED;
    writeFile(path, stringify(object), error => {
      state &= ~PENDING;
      if (error) {
        if (watcher) watcher(error, object);
        else throw error;
      }
      if (state & CHANGED) save();
      else if (watcher) watcher(null, object);
    });
  }

  function plan() {
    state |= CHANGED;
    if (!(state & PENDING)) {
      state |= PENDING;
      nextTick(save);
    }
    return true;
  }

  function def(target, key, description) {
    description.value = wrap(description.value);
    Object.defineProperty(target, key, description);
    return plan();
  }

  function del(target, key) {
    delete target[key];
    return plan();
  }

  function set(target, key, value) {
    target[key] = wrap(value);
    return plan();
  }

  function wrap(target) {
    if (typeof target !== 'object') return target;
    for (const key of Object.keys(target)) {
      const wrapped = wrap(target[key]);
      target[key] = wrapped;
      if (target[key] !== wrapped)
        throw new Error(`Property ${key} cannot be proxied`);
    }
    return new Proxy(target, { defineProperty: def, deleteProperty: del, set });
  }

  return load().then(parse).then(target => object = wrap(target));
}
