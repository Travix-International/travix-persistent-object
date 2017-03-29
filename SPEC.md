# TOC
   - [persistent](#persistent)
     - [persistent(path)](#persistent-persistentpath)
     - [persistent(path:string)](#persistent-persistentpathstring)
     - [persistent(path:string, depth:number)](#persistent-persistentpathstring-depthnumber)
     - [persistent(path:string, prototype:object)](#persistent-persistentpathstring-prototypeobject)
     - [persistent(path:string, watcher:function)](#persistent-persistentpathstring-watcherfunction)
     - [persistent(path:string, option)](#persistent-persistentpathstring-option)
     - [persistent(path:string, prototype:object, option)](#persistent-persistentpathstring-prototypeobject-option)
<a name=""></a>
 
<a name="persistent"></a>
# persistent
is a function.

```js
return expect(persistent).to.be.a('function')
```

<a name="persistent-persistentpath"></a>
## persistent(path)
throws TypeError if path is not a string.

```js
return expect(() => persistent(42)).to.throw(TypeError)
```

<a name="persistent-persistentpathstring"></a>
## persistent(path:string)
calls fs.readFile with arguments (path).

```js
return persistent('path').then(() => expect(fs.readFile).to.have.been.calledWith('path'))
```

eventually resolves to object parsed from json returned by fs.readFile.

```js
const object = { test: 42 };
fs.readFile.result = stringify(object);
return expect(persistent('path')).to.be.fulfilled.and.eventually.deep.equal(object);
```

eventually resolves to empty object when fs.readFile reports ENOENT error.

```js
fs.readFile.error = ENOENT;
return expect(persistent('path')).to.be.fulfilled.and.eventually.be.empty;
```

eventually rejects with error reported by fs.readFile if error is not ENOENT.

```js
fs.readFile.error = EACCES;
return expect(persistent('path')).to.be.rejectedWith(EACCES);
```

eventually calls fs.writeFile once with arguments (path, json) when object property is defined.

```js
return persistent('path')
  .then(object => Object.defineProperty(object, 'test', {}))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when object property is deleted.

```js
fs.readFile.error = ENOENT;
return persistent('path', { test: 42 })
  .then(object => (delete object.test, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when object property is set.

```js
return persistent('path')
  .then(object => (object.test = 42, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array length is decreased.

```js
fs.readFile.error = ENOENT;
return persistent('path', [42])
  .then(array => (array.length = 0, array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array length is increased.

```js
fs.readFile.error = ENOENT;
return persistent('path', [])
  .then(array => (array.length = 1, array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array is filled with item.

```js
fs.readFile.error = ENOENT;
return persistent('path', [1, 2])
  .then(array => (array.fill(42), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is popped.

```js
fs.readFile.error = ENOENT;
return persistent('path', [42])
  .then(array => (array.pop(), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is pushed.

```js
fs.readFile.error = ENOENT;
return persistent('path', [])
  .then(array => (array.push(42), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is removed with splice.

```js
fs.readFile.error = ENOENT;
return persistent('path', [42])
  .then(array => (array.splice(0, 1), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is added with splice.

```js
fs.readFile.error = ENOENT;
return persistent('path', [42])
  .then(array => (array.splice(0, 0, 42), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array is reversed.

```js
fs.readFile.error = ENOENT;
return persistent('path', [1, 2])
  .then(array => (array.reverse(), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is shifted.

```js
fs.readFile.error = ENOENT;
return persistent('path', [42])
  .then(array => (array.shift(), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is sorted.

```js
fs.readFile.error = ENOENT;
return persistent('path', [2, 1, 3])
  .then(array => (array.sort(), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile once with arguments (path, json) when array item is unshifted.

```js
fs.readFile.error = ENOENT;
return persistent('path', [])
  .then(array => (array.unshift(42), array))
  .then(defer)
  .then(array =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(array))
  )
```

eventually calls fs.writeFile twice with arguments (path, json) when an object shared between two persistent objects is changed.

```js
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
```

eventually calls fs.writeFile once when object is modified several times together.

```js
return persistent('path')
  .then(object => (object.test = 42, delete object.test, object))
  .then(defer)
  .then(() =>
    expect(fs.writeFile).to.have.been.calledOnce
  )
```

eventually calls fs.writeFile again if object is modified when saving is in progress.

```js
fs.writeFile.delay = true;
return persistent('path')
  .then(object => (object.test = 42, object))
  .then(defer)
  .then(object => (fs.writeFile.delay = false, object.test = 24, object))
  .then(delay)
  .then(() =>
    expect(fs.writeFile).to.have.been.calledTwice
  );
```

eventually throws error reported by fs.writeFile if watcher is not specified.

```js
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
```

throws TypeError if property being defined cannot be proxied.

```js
return persistent('path').then(object =>
  expect(() => Object.defineProperty(object, 'test', { value: {} })).to.throw(TypeError)
)
```

throws TypeError if property being set cannot be proxied.

```js
const property = Object.defineProperty({}, 'test', { value: {} });
return persistent('path').then(object =>
  expect(() => object.property = property).to.throw(Error)
)
```

<a name="persistent-persistentpathstring-depthnumber"></a>
## persistent(path:string, depth:number)
tracks object changes to specified depth only.

```js
fs.readFile.result = stringify({ property: { value: 42 } });
return persistent('path', 1)
  .then(object => (object.property.value = 24, object))
  .then(defer)
  .then(() =>
    expect(fs.writeFile).to.not.have.been.called
  );
```

<a name="persistent-persistentpathstring-prototypeobject"></a>
## persistent(path:string, prototype:object)
eventually resolves to prototype object when fs.readFile reports ENOENT.

```js
const prototype = { test: 42 };
fs.readFile.error = ENOENT;
return expect(persistent('path', prototype)).to.be.fulfilled.and.eventually.deep.equal(prototype);
```

eventually calls fs.writeFile once with arguments (path, json) after property is deleted.

```js
fs.readFile.error = ENOENT;
return persistent('path', { test: 42 })
  .then(object => (delete object.test, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once with arguments (path, json) after nested property is set.

```js
fs.readFile.error = ENOENT;
return persistent('path', { test: {} })
  .then(object => (object.test.value = 42, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once with arguments (path, json) after nested array item is added.

```js
fs.readFile.error = ENOENT;
return persistent('path', { array: [] })
  .then(object => (object.array.push(42), object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once with arguments (path, json) after nested array item is changed.

```js
fs.readFile.error = ENOENT;
return persistent('path', { array: [1] })
  .then(object => (object.array[0] = 42, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

<a name="persistent-persistentpathstring-watcherfunction"></a>
## persistent(path:string, watcher:function)
eventually calls watcher with arguments (null, object) after object is saved.

```js
const watcher = spy();
return persistent('path', watcher)
  .then(object => (object.test = 42, object))
  .then(defer)
  .then(object =>
    expect(watcher).to.have.been.calledOnce.and.calledAfter(fs.writeFile).and.calledWith(null, object)
  );
```

eventually calls watcher with arguments (error, object) when fs.writeFile reports error.

```js
fs.writeFile.error = EACCES;
const watcher = spy();
return persistent('path', watcher)
  .then(object => (object.test = 42, object))
  .then(defer)
  .then(object =>
    expect(watcher).to.have.been.calledWith(EACCES, object)
  );
```

<a name="persistent-persistentpathstring-option"></a>
## persistent(path:string, option)
throws TypeError if options is not object or function (watcher) or number (depth).

```js
return expect(() => persistent('path', true)).to.throw(TypeError)
```

<a name="persistent-persistentpathstring-prototypeobject-option"></a>
## persistent(path:string, prototype:object, option)
throws TypeError if options is not object or function (watcher) or number (depth).

```js
return expect(() => persistent('path', [], true)).to.throw(TypeError)
```

