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

  it('is a function', () =>
    expect(persistent).to.be.a('function')
  );

  describe('persistent(path)', () => {
    it('throws TypeError if path is not a string', () =>
      expect(() => persistent(42)).to.throw(TypeError)
    );
  });

  describe('persistent(path:string)', () => {
    it('calls fs.readFile with arguments (path)', () =>
      persistent('path').then(() => expect(fs.readFile).to.have.been.calledWith('path'))
    );

    it('eventually resolves to object parsed from json returned by fs.readFile', () => {
      const object = { test: 42 };
      fs.readFile.result = stringify(object);
      return expect(persistent('path')).to.be.fulfilled.and.eventually.deep.equal(object);
    });

    it('eventually resolves to empty object when fs.readFile reports ENOENT error', () => {
      fs.readFile.error = ENOENT;
      return expect(persistent('path')).to.be.fulfilled.and.eventually.be.empty;
    });

    it('eventually rejects with error reported by fs.readFile if error is not ENOENT', () => {
      fs.readFile.error = EACCES;
      return expect(persistent('path')).to.be.rejectedWith(EACCES);
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is defined', () =>
      persistent('path')
        .then(object =>
          Object.defineProperty(object, 'test', {})
        )
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    );

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is set', () =>
      persistent('path')
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    );

    it('eventually calls fs.writeFile once when object is modified several times together', () =>
      persistent('path')
        .then(object => (object.test = 42, delete object.test, object))
        .then(defer)
        .then(() =>
          expect(fs.writeFile).to.have.been.calledOnce
        )
    );

    it('eventually calls fs.writeFile again if object is modified when saving is in progress', () => {
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

    it('eventually throws error reported by fs.writeFile if watcher is not specified', () => {
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

    it('throws TypeError if property being defined cannot be proxied', () =>
      persistent('path').then(object =>
        expect(() => Object.defineProperty(object, 'test', { value: {} })).to.throw(TypeError)
      )
    );

    it('throws TypeError if property being set cannot be proxied', () => {
      const property = Object.defineProperty({}, 'test', { value: {} });
      return persistent('path').then(object =>
        expect(() => object.property = property).to.throw(Error)
      )
    });
  });

  describe('persistent(path:string, depth:number)', () => {
    it('tracks object changes to specified depth only', () => {
      fs.readFile.result = stringify({ property: { value: 42 } });
      return persistent('path', 1)
        .then(object => (object.property.value = 24, object))
        .then(defer)
        .then(() =>
          expect(fs.writeFile).to.not.have.been.called
        );
    });
  });

  describe('persistent(path:string, prototype:object)', () => {
    it('eventually resolves to prototype object when fs.readFile reports ENOENT', () => {
      const prototype = { test: 42 };
      fs.readFile.error = ENOENT;
      return expect(persistent('path', prototype)).to.be.fulfilled.and.eventually.deep.equal(prototype);
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after property is deleted', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { test: 42 })
        .then(object => (delete object.test, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after nested property is set', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { test: {} })
        .then(object => (object.test.value = 42, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });
  });

  describe('persistent(path:string, watcher:function)', () => {
    it('eventually calls watcher with arguments (null, object) after object is saved', () => {
      const watcher = spy();
      return persistent('path', watcher)
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(watcher).to.have.been.calledOnce.and.calledAfter(fs.writeFile).and.calledWith(null, object)
        );
    });

    it('eventually calls watcher with arguments (error, object) when fs.writeFile reports error', () => {
      fs.writeFile.error = EACCES;
      const watcher = spy();
      return persistent('path', watcher)
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(watcher).to.have.been.calledWith(EACCES, object)
        );
    });
  });

  describe('persistent(path:string, option)', () => {
    it('throws TypeError if options is not object or function (watcher) or number (depth)', () => {
      expect(() => persistent('path', true)).to.throw(TypeError)
    });
  });

  describe('persistent(path:string, prototype:object, option)', () => {
    it('throws TypeError if options is not object or function (watcher) or number (depth)', () => {
      expect(() => persistent('path', [], true)).to.throw(TypeError)
    });
  });
});
