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
    it('throws TypeError if path is not a string', () => {
      expect(() => persistent(42)).to.throw(TypeError)
    });
  });

  describe('persistent(path:string)', () => {
    it('calls fs.readFile with arguments (path)', () => {
      persistent('path').then(() => expect(fs.readFile).to.have.been.calledWith('path'))
    });

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

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is defined', () => {
      persistent('path')
        .then(object => Object.defineProperty(object, 'test', {}))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is deleted', () => {
      fs.readFile.error = ENOENT;
      persistent('path', { test: 42 })
        .then(object => (delete object.test, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is set', () => {
      persistent('path')
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array length is decreased', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [42])
        .then(array => (array.length = 0, array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array length is increased', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [])
        .then(array => (array.length = 1, array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array is filled with item', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [1, 2])
        .then(array => (array.fill(42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is popped', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [42])
        .then(array => (array.pop(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is pushed', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [])
        .then(array => (array.push(42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is removed with splice', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [42])
        .then(array => (array.splice(0, 1), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is added with splice', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [42])
        .then(array => (array.splice(0, 0, 42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array is reversed', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [1, 2])
        .then(array => (array.reverse(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is shifted', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [42])
        .then(array => (array.shift(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is sorted', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [2, 1, 3])
        .then(array => (array.sort(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is unshifted', () => {
      fs.readFile.error = ENOENT;
      persistent('path', [])
        .then(array => (array.unshift(42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile twice with arguments (path, json) when an object shared between two persistent objects is changed', () => {
      fs.readFile.error = ENOENT;
      const shared = {};
      return Promise.all([ persistent('path0'), persistent('path1') ])
        .then(objects => (objects[0].shared = objects[1].shared = shared, shared.test = 42, objects))
        .then(defer)
        .then(objects =>
          expect(fs.writeFile).to.have.been.calledTwice
            .and.calledWith('path0', stringify(objects[0]))
            .and.calledWith('path1', stringify(objects[1]))
        );
    });

    it('eventually calls fs.writeFile once when object is modified several times together', () => {
      persistent('path')
        .then(object => (object.test = 42, delete object.test, object))
        .then(defer)
        .then(() =>
          expect(fs.writeFile).to.have.been.calledOnce
        )
    });

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

    it('throws TypeError if property being defined cannot be proxied', () => {
      persistent('path').then(object =>
        expect(() => Object.defineProperty(object, 'test', { value: {} })).to.throw(TypeError)
      )
    });

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

    it('eventually calls fs.writeFile once with arguments (path, json) after nested array item is added', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { array: [] })
        .then(object => (object.array.push(42), object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after nested array item is changed', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { array: [1] })
        .then(object => (object.array[0] = 42, object))
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
