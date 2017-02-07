'option strict';

const { readFile, writeFile } = require('fs');
const { nextTick } = process;
const { parse, stringify } = JSON;

const $nest = Symbol();

module.exports = function persistent(path, ...options) {
  if (typeof path !== 'string' || !path.length)
    throw new TypeError('Argument "path" expected to be not empty string');

  let depth = 0, prototype = {}, watcher;
  const { length } = options;
  for (let i = -1; ++i < length;) {
    const option = options[i];
    const type = typeof option;
    switch (type) {
      case 'function':
        watcher = option;
        break;
      case 'number':
        depth = option;
        break;
      case 'object':
        prototype = option;
        break;
      default:
        throw new TypeError(`Argument #${i + 1} has unsupported type: ${type}.`);
    }
  }

  const CHANGED = 1, PENDING = 2;
  let object, state = 0;

  function load() {
    return new Promise((resolve, reject) =>
      readFile(path, (error, data) =>
        error
          ? error.code === 'ENOENT'
            ? resolve(object = wrap(1, prototype))
            : reject(error)
          : resolve(object = wrap(1, parse(data)))
      )
    );
  }

  function plan() {
    state |= CHANGED;
    if (!(state & PENDING)) {
      state |= PENDING;
      nextTick(save);
    }
    return true;
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

  function def(target, key, description) {
    description.value = wrap(target[$nest] + 1, description.value);
    Object.defineProperty(target, key, description);
    return plan();
  }

  function del(target, key) {
    delete target[key];
    return plan();
  }

  function set(target, key, value) {
    target[key] = wrap(target[$nest] + 1, value);
    return plan();
  }

  function wrap(nest, target) {
    if (target == null || typeof target !== 'object') return target;
    if (depth < 1 || nest < depth) {
      for (const key of Object.getOwnPropertyNames(target)) {
        const wrapped = wrap(nest + 1, target[key]);
        target[key] = wrapped;
        if (target[key] !== wrapped)
          throw new Error(`Property "${key}" cannot be proxied`);
      }
    }
    target[$nest] = nest;
    return new Proxy(target, { defineProperty: def, deleteProperty: del, set });
  }

  return load();
}
