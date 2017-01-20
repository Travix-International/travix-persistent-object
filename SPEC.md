# TOC
   - [persistent](#persistent)
<a name=""></a>
 
<a name="persistent"></a>
# persistent
is a function.

```js
expect(persistent).to.be.a('function');
```

throws TypeError if first argument (path) is not string.

```js
expect(() => persistent(42)).to.throw(TypeError);
```

throws TypeError if second argument (prototype or watcher) is not function or object.

```js
expect(() => persistent('path', 42)).to.throw(TypeError);
```

throws TypeError if third argument (watcher) is not function.

```js
expect(() => persistent('path', {}, 42)).to.throw(TypeError);
```

calls fs.readFile with path argument.

```js
return persistent('path')
  .then(() => expect(fs.readFile).to.have.been.calledWith('path'));
```

eventually resolves to object parsed from json returned by fs.readFile.

```js
const object = { test: 42 };
fs.readFile.result = stringify(object);
return expect(persistent('path')).to.be.fulfilled.and.eventually.deep.equal(object);
```

eventually resolves to empty object when fs.readFile returns ENOENT error.

```js
fs.readFile.error = ENOENT;
return expect(persistent('path')).to.be.fulfilled.and.eventually.be.empty;
```

eventually resolves to prototype object when fs.readFile returns ENOENT error.

```js
const prototype = { test: 42 };
fs.readFile.error = ENOENT;
return expect(persistent('path', prototype)).to.be.fulfilled.and.eventually.deep.equal(prototype);
```

eventually rejects with error returned from fs.readFile when error is not ENOENT.

```js
fs.readFile.error = EACCES;
return expect(persistent('path')).to.be.rejectedWith(EACCES);
```

eventually calls fs.writeFile once with arguments (path, json) when object property was deleted.

```js
fs.readFile.error = ENOENT;
return persistent('path', { test: 42 })
  .then(object => (delete object.test, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once with arguments (path, json) when object property was defined.

```js
return persistent('path')
  .then(object =>
    Object.defineProperty(object, 'test', {})
  )
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once with path and json arguments when object property was set.

```js
return persistent('path')
  .then(object => (object.test = 42, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once with path and json arguments when object subproperty was set.

```js
fs.readFile.error = ENOENT;
return persistent('path', { test: {} })
  .then(object => (object.test.value = 42, object))
  .then(defer)
  .then(object =>
    expect(fs.writeFile).to.have.been.calledOnce.and.calledWith('path', stringify(object))
  );
```

eventually calls fs.writeFile once when object was modified several times promptly.

```js
return persistent('path')
  .then(object => (object.test = 42, delete object.test, object))
  .then(defer)
  .then(() =>
    expect(fs.writeFile).to.have.been.calledOnce
  );
```

eventually calls fs.writeFile again if object was modified when saving is in progress.

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

eventually calls watcher with arguments (error, object) when error was returned from fs.writeFile.

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

eventually throws error returned from fs.writeFile when watcher is not specified.

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

throws error if property being set cannot be proxied.

```js
const property = Object.defineProperty({}, 'test', { enumerable: true, value: {} });
return persistent('path').then(object => {
  expect(() => object.test = property).to.throw;
});
```

