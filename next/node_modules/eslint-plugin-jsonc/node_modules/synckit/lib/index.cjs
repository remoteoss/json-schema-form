'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var worker_threads = require('worker_threads');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var _a;
const {
  SYNCKIT_BUFFER_SIZE,
  SYNCKIT_TIMEOUT,
  SYNCKIT_TS_ESM,
  SYNCKIT_EXEC_ARV
} = process.env;
const TS_USE_ESM = !!SYNCKIT_TS_ESM && ["1", "true"].includes(SYNCKIT_TS_ESM);
const DEFAULT_BUFFER_SIZE = SYNCKIT_BUFFER_SIZE ? +SYNCKIT_BUFFER_SIZE : void 0;
const DEFAULT_TIMEOUT = SYNCKIT_TIMEOUT ? +SYNCKIT_TIMEOUT : void 0;
const DEFAULT_WORKER_BUFFER_SIZE = DEFAULT_BUFFER_SIZE || 1024;
const DEFAULT_EXEC_ARGV = (_a = SYNCKIT_EXEC_ARV == null ? void 0 : SYNCKIT_EXEC_ARV.split(",")) != null ? _a : [];
const syncFnCache = /* @__PURE__ */ new Map();
const extractProperties = (object) => {
  if (object && typeof object === "object") {
    const properties = {};
    for (const key in object) {
      properties[key] = object[key];
    }
    return properties;
  }
};
function createSyncFn(workerPath, bufferSizeOrOptions, timeout) {
  if (!path__default["default"].isAbsolute(workerPath)) {
    throw new Error("`workerPath` must be absolute");
  }
  const cachedSyncFn = syncFnCache.get(workerPath);
  if (cachedSyncFn) {
    return cachedSyncFn;
  }
  const syncFn = startWorkerThread(workerPath, typeof bufferSizeOrOptions === "number" ? { bufferSize: bufferSizeOrOptions, timeout } : bufferSizeOrOptions);
  syncFnCache.set(workerPath, syncFn);
  return syncFn;
}
const throwError = (msg) => {
  throw new Error(msg);
};
function startWorkerThread(workerPath, {
  bufferSize = DEFAULT_WORKER_BUFFER_SIZE,
  timeout = DEFAULT_TIMEOUT,
  execArgv = DEFAULT_EXEC_ARGV
} = {}) {
  const { port1: mainPort, port2: workerPort } = new worker_threads.MessageChannel();
  const isTs = workerPath.endsWith(".ts");
  const worker = new worker_threads.Worker(isTs ? TS_USE_ESM ? throwError("Native esm in `.ts` file is not supported yet, please use `.cjs` instead") : `require('ts-node/register');require('${workerPath}')` : workerPath, {
    eval: isTs,
    workerData: { workerPort },
    transferList: [workerPort],
    execArgv
  });
  let nextID = 0;
  const syncFn = (...args) => {
    const id = nextID++;
    const sharedBuffer = new SharedArrayBuffer(bufferSize);
    const sharedBufferView = new Int32Array(sharedBuffer);
    const msg = { sharedBuffer, id, args };
    worker.postMessage(msg);
    const status = Atomics.wait(sharedBufferView, 0, 0, timeout);
    if (!["ok", "not-equal"].includes(status)) {
      throw new Error("Internal error: Atomics.wait() failed: " + status);
    }
    const {
      id: id2,
      result,
      error,
      properties
    } = worker_threads.receiveMessageOnPort(mainPort).message;
    if (id !== id2) {
      throw new Error(`Internal error: Expected id ${id} but got id ${id2}`);
    }
    if (error) {
      throw Object.assign(error, properties);
    }
    return result;
  };
  worker.unref();
  return syncFn;
}
function runAsWorker(fn) {
  if (!worker_threads.workerData) {
    return;
  }
  const { workerPort } = worker_threads.workerData;
  worker_threads.parentPort.on("message", ({ sharedBuffer, id, args }) => {
    (() => __async(this, null, function* () {
      const sharedBufferView = new Int32Array(sharedBuffer);
      let msg;
      try {
        msg = { id, result: yield fn(...args) };
      } catch (error) {
        msg = {
          id,
          error,
          properties: extractProperties(error)
        };
      }
      workerPort.postMessage(msg);
      Atomics.add(sharedBufferView, 0, 1);
      Atomics.notify(sharedBufferView, 0);
    }))();
  });
}

exports.DEFAULT_BUFFER_SIZE = DEFAULT_BUFFER_SIZE;
exports.DEFAULT_EXEC_ARGV = DEFAULT_EXEC_ARGV;
exports.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;
exports.DEFAULT_WORKER_BUFFER_SIZE = DEFAULT_WORKER_BUFFER_SIZE;
exports.createSyncFn = createSyncFn;
exports.extractProperties = extractProperties;
exports.runAsWorker = runAsWorker;
