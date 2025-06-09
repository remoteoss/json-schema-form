import { AnyAsyncFn, Syncify } from './types.js';
export * from './types.js';
export declare const DEFAULT_BUFFER_SIZE: number | undefined;
export declare const DEFAULT_TIMEOUT: number | undefined;
export declare const DEFAULT_WORKER_BUFFER_SIZE: number;
export declare const DEFAULT_EXEC_ARGV: string[];
export interface SynckitOptions {
    bufferSize?: number;
    timeout?: number;
    execArgv?: string[];
}
export declare const extractProperties: <T>(object?: T | undefined) => T | undefined;
export declare function createSyncFn<T extends AnyAsyncFn>(workerPath: string, bufferSize?: number, timeout?: number): Syncify<T>;
export declare function createSyncFn<T extends AnyAsyncFn>(workerPath: string, options?: SynckitOptions): Syncify<T>;
export declare function runAsWorker<R = unknown, T extends AnyAsyncFn<R> = AnyAsyncFn<R>>(fn: T): void;
