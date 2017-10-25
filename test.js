'option strict';

const chai = require('chai');
chai.use(require("chai-as-promised"));
chai.use(require('sinon-chai'));
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { expect } = chai;
const { spy } = sinon;
const { stringify } = JSON;

const EACCES = new Error;
EACCES.code = 'EACCES';
const ENOENT = new Error;
ENOENT.code = 'ENOENT';

const delay = 100;
let clock;
const defer = value => new Promise(
  resolve => (clock.tick(delay),resolve(value))
);

const fs = {
  readFile: spy((path, callback) => callback(fs.readFile.error, fs.readFile.result)),
  writeFile: spy((path, data, callback) => callback(fs.writeFile.error)
  )
};
const persistent = proxyquire('./', { fs });

describe('persistent', () => {
  beforeEach(() => {
    clock = sinon.useFakeTimers();

    fs.readFile.error = null;
    fs.readFile.result = '{}';
    fs.readFile.reset();
    fs.writeFile.error = null;
    fs.writeFile.reset();
  });

  afterEach(() => {
    clock.restore();
  });

  it('is a function', () => {
    return expect(persistent).to.be.a('function')
  });

  describe('persistent(path)', () => {
    it('throws TypeError if path is not a string', () => {
      return expect(() => persistent(42)).to.throw(TypeError)
    });
  });

  describe('persistent(path:string)', () => {
    it('calls fs.readFile with arguments (path)', () => {
      return persistent('path').then(() => expect(fs.readFile).to.have.been.calledWith('path'))
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
      return persistent('path')
        .then(object => Object.defineProperty(object, 'test', {}))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is deleted', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: { test: 42 }})
        .then(object => (delete object.test, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when object property is set', () => {
      return persistent('path')
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array length is decreased', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [42]})
        .then(array => (array.length = 0, array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array length is increased', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [] })
        .then(array => (array.length = 1, array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array is filled with item', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [1, 2]})
        .then(array => (array.fill(42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is popped', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [42]})
        .then(array => (array.pop(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is pushed', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: []})
        .then(array => (array.push(42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is removed with splice', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [42]})
        .then(array => (array.splice(0, 1), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is added with splice', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [42]})
        .then(array => (array.splice(0, 0, 42), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array is reversed', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [1, 2]})
        .then(array => (array.reverse(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is shifted', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [42]})
        .then(array => (array.shift(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is sorted', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: [2, 1, 3]})
        .then(array => (array.sort(), array))
        .then(defer)
        .then(array =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
        )
    });

    it('eventually calls fs.writeFile once with arguments (path, json) when array item is unshifted', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: []})
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
      return persistent('path')
        .then(object => (object.test = 42, delete object.test, object))
        .then(defer)
        .then(() =>
          expect(fs.writeFile).to.have.been.calledOnce
        )
    });

    it('eventually calls fs.writeFile only once if object is modified when saving is in progress', () => {
      return persistent('path')
        .then(object => (object.test = 42, object))
        .then(object => (object.test = 24, object))
        .then(defer)
        .then(() =>
          expect(fs.writeFile).to.have.been.calledOnce
        );
    });

    it('throws TypeError if property being defined cannot be proxied', () => {
      return persistent('path').then(object =>
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

  describe('persistent(path:string, option)', () => {
    it('tracks object changes to specified depth only', () => {
      fs.readFile.result = stringify({ property: { value: 42 } });
      return persistent('path', { depth: 1})
        .then(object => (object.property.value = 24, object))
        .then(defer)
        .then(() =>
          expect(fs.writeFile).to.not.have.been.called
        );
    });

    it('eventually resolves to prototype object when fs.readFile reports ENOENT', () => {
      const prototype = { test: 42 };
      fs.readFile.error = ENOENT;
      return expect(persistent('path', { prototype })).to.be.fulfilled.and.eventually.deep.equal(prototype);
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after property is deleted', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: { test: 42 }})
        .then(object => (delete object.test, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after nested property is set', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: { test: {} }})
        .then(object => (object.test.value = 42, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after nested array item is added', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: { array: [] }})
        .then(object => (object.array.push(42), object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });

    it('eventually calls fs.writeFile once with arguments (path, json) after nested array item is changed', () => {
      fs.readFile.error = ENOENT;
      return persistent('path', { prototype: { array: [1] }})
        .then(object => (object.array[0] = 42, object))
        .then(defer)
        .then(object =>
          expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
        );
    });

    it('eventually calls watcher with arguments (null, object) after object is saved', () => {
      const watcher = spy();
      return persistent('path', { watcher })
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(watcher).to.have.been.calledOnce.and.calledAfter(fs.writeFile).and.calledWith(null, object)
        );
    });

    it('eventually calls watcher with arguments (error, object) when fs.writeFile reports error', () => {
      fs.writeFile.error = EACCES;
      const watcher = spy();
      return persistent('path', { watcher })
        .then(object => (object.test = 42, object))
        .then(defer)
        .then(object =>
          expect(watcher).to.have.been.calledWith(EACCES, object)
        );
    });

    it('throws TypeError if delay option is not a number', () => {
      return expect(() => persistent('path', { delay: true })).to.throw(TypeError);
    });

    it('throws TypeError if depth option is not a number', () => {
      return expect(() => persistent('path', { depth: true })).to.throw(TypeError);
    });

    it('throws TypeError if prototype option is not an object', () => {
      return expect(() => persistent('path', { prototype: true })).to.throw(TypeError);
    });

    it('throws TypeError if watcher is not a function', () => {
      return expect(() => persistent('path', { watcher: true})).to.throw(TypeError);
    });
  });
});
