/* global beforeEach, describe, it, Promise */

'option strict';

const chai = require('chai');
chai.use(require("chai-as-promised"));
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { expect } = chai;
const { spy } = sinon;
const { stringify } = JSON;
const { nextTick } = process;

const EACCES = new Error;
EACCES.code = 'EACCES';
const ENOENT = new Error;
ENOENT.code = 'ENOENT';

const defer = value => new Promise(
  resolve => nextTick(() => resolve(value))
);

const delay = value => new Promise(
  resolve => setTimeout(() => resolve(value))
);

const fs = {
  readFile: spy((path, callback) => callback(fs.readFile.error, fs.readFile.result)),
  writeFile: spy((path, data, callback) =>
    fs.writeFile.delay
      ? delay().then(() => callback(fs.writeFile.error))
      : callback(fs.writeFile.error)
  )
};
const persistent = proxyquire('./', { fs });

describe('persistent', () => {
  beforeEach(() => {
    fs.readFile.error = null;
    fs.readFile.result = '{}';
    fs.readFile.reset();
    fs.writeFile.delay = false;
    fs.writeFile.error = null;
    fs.writeFile.reset();
  });

  it('is a function', () => {
    expect(persistent).to.be.a('function');
  });

  it('throws TypeError if first argument (path) is not string', () => {
    expect(() => persistent(42)).to.throw(TypeError);
  });

  it('throws TypeError if second argument (prototype or watcher) is not function or object', () => {
    expect(() => persistent('path', 42)).to.throw(TypeError);
  });

  it('throws TypeError if third argument (watcher) is not function', () => {
    expect(() => persistent('path', {}, 42)).to.throw(TypeError);
  });

  it('calls fs.readFile with path argument', () => {
    return persistent('path')
      .then(() => expect(fs.readFile).to.have.been.calledWith('path'));
  });

  it('eventually resolves to object parsed from json returned by fs.readFile', () => {
    const object = { test: 42 };
    fs.readFile.result = stringify(object);
    return expect(persistent('path')).to.be.fulfilled.and.eventually.deep.equal(object);
  });

  it('eventually resolves to empty object when fs.readFile returns ENOENT error', () => {
    fs.readFile.error = ENOENT;
    return expect(persistent('path')).to.be.fulfilled.and.eventually.be.empty;
  });

  it('eventually resolves to prototype object when fs.readFile returns ENOENT error', () => {
    const prototype = { test: 42 };
    fs.readFile.error = ENOENT;
    return expect(persistent('path', prototype)).to.be.fulfilled.and.eventually.deep.equal(prototype);
  });

  it('eventually rejects with error returned from fs.readFile when error is not ENOENT', () => {
    fs.readFile.error = EACCES;
    return expect(persistent('path')).to.be.rejectedWith(EACCES);
  });

  it('eventually calls fs.writeFile once with arguments (path, json) when object property was deleted', () => {
    fs.readFile.error = ENOENT;
    return persistent('path', { test: 42 })
      .then(object => (delete object.test, object))
      .then(defer)
      .then(object =>
        expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
      );
  });

  it('eventually calls fs.writeFile once with arguments (path, json) when object property was defined', () => {
    return persistent('path')
      .then(object =>
        Object.defineProperty(object, 'test', {})
      )
      .then(defer)
      .then(object =>
        expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
      );
  });

  it('eventually calls fs.writeFile once with path and json arguments when object property was set', () => {
    return persistent('path')
      .then(object => (object.test = 42, object))
      .then(defer)
      .then(object =>
        expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
      );
  });

  it('eventually calls fs.writeFile once with path and json arguments when object subproperty was set', () => {
    fs.readFile.error = ENOENT;
    return persistent('path', { test: {} })
      .then(object => (object.test.value = 42, object))
      .then(defer)
      .then(object =>
        expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
      );
  });

  it('eventually calls fs.writeFile once when object was modified several times promptly', () => {
    return persistent('path')
      .then(object => (object.test = 42, delete object.test, object))
      .then(defer)
      .then(() =>
        expect(fs.writeFile).to.have.been.calledOnce
      );
  });

  it('eventually calls fs.writeFile again if object was modified when saving is in progress', () => {
    fs.writeFile.delay = true;
    return persistent('path')
      .then(object => (object.test = 42, object))
      .then(defer)
      .then(object => (fs.writeFile.delay = false, object.test = 24, object))
      .then(delay)
      .then(() =>
        expect(fs.writeFile).to.have.been.calledTwice
      );
  });

  it('eventually calls watcher with arguments (null, object) after object is saved', () => {
    const watcher = spy();
    return persistent('path', watcher)
      .then(object => (object.test = 42, object))
      .then(defer)
      .then(object =>
        expect(watcher).to.have.been.calledOnce.and.calledAfter(fs.writeFile).and.calledWith(null, object)
      );
  });

  it('eventually calls watcher with arguments (error, object) when error was returned from fs.writeFile', () => {
    fs.writeFile.error = EACCES;
    const watcher = spy();
    return persistent('path', watcher)
      .then(object => (object.test = 42, object))
      .then(defer)
      .then(object =>
        expect(watcher).to.have.been.calledWith(EACCES, object)
      );
  });

  it('eventually throws error returned from fs.writeFile when watcher is not specified', () => {
    fs.writeFile.error = EACCES;
    const uncaughtException = spy();
    process.removeAllListeners('uncaughtException');
    process.on('uncaughtException', uncaughtException);
    return persistent('path')
      .then(object => (object.test = 42, object))
      .then(defer)
      .then(() =>
        expect(uncaughtException).to.have.been.calledWith(EACCES)
      );
  });

  it('throws error if property being set cannot be proxied', () => {
    const property = Object.defineProperty({}, 'test', { enumerable: true, value: {} });
    return persistent('path').then(object => {
      expect(() => object.test = property).to.throw;
    });
  });
});
