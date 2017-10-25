'option strict';

const { readFile, writeFile } = require('fs');
const { parse, stringify } = JSON;

const defaultOptions = { delay: 0, depth: 0, prototype: {}};
let id = 0;

module.exports = function persistent(path, options = {}) {
  if (typeof path !== 'string' || !path.length)
    throw new TypeError('Argument "path" must be not empty string.');

  const { delay, depth, prototype, watcher } = Object.assign({}, defaultOptions, options);

  if (typeof delay !== 'number')
    throw new TypeError(`Argument delay has unsupported type: ${typeof delay}.`);
  if (typeof depth !== 'number')
    throw new TypeError(`Argument depth has unsupported type: ${typeof depth}.`);
  if (typeof prototype !== 'object')
    throw new TypeError(`Argument prototype has unsupported type: ${typeof prototype}.`);
  if (watcher && typeof watcher !== 'function')
    throw new TypeError(`Argument watcher has unsupported type: ${typeof watcher}.`);

  const $nest = Symbol(++id);
  let object, saving = false, timeout, trap = true;

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
    if (!saving) {
      saving = true;
      timeout = setTimeout(save, delay);
    }
    if (timeout) {
      clearTimeout(timeout);
      timeout = setTimeout(save, delay);
    }
    return true;
  }

  function save() {
    timeout = undefined;
    writeFile(path, stringify(object), error => {
      saving = false;
      if (error) {
        if (watcher) watcher(error, object);
        else throw error;
      }
      else if (watcher) watcher(null, object);
    });
  }

  function traps(nest) {
    return {
      defineProperty(target, key, descriptor) {
        if (!trap) descriptor.value = wrap(nest + 1, descriptor.value);
        Object.defineProperty(target, key, descriptor);
        return plan();
      },
      deleteProperty(target, key) {
        delete target[key];
        return plan();
      },
      set(target, key, value) {
        target[key] = trap ? value : wrap(nest + 1, value);
        return plan();
      }
    };
  }

  function wrap(nest, target) {
    if (target == null || typeof target !== 'object' || target[$nest] === nest) return target;
    if ((depth < 1 || nest < depth)) {
      for (const key of Object.getOwnPropertyNames(target)) {
        const wrapped = wrap(nest + 1, target[key]);
        trap = true;
        target[key] = wrapped;
        trap = false;
        if (target[key] !== wrapped) throw new Error(`Property "${key}" cannot be proxied.`);
      }
    }
    trap = true;
    target[$nest] = nest;
    trap = false;
    return new Proxy(target, traps(nest));
  }

  return load();
}
