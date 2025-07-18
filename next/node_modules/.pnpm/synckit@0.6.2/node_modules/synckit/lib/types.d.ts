/// <reference types="node" />
import { MessagePort } from 'worker_threads';
export declare type AnyFn<R = any, T extends any[] = any[]> = (...args: T) => R;
export declare type AnyPromise<T = any> = Promise<T>;
export declare type AnyAsyncFn<T = any> = AnyFn<Promise<T>>;
export declare type Syncify<T extends AnyAsyncFn> = T extends (...args: infer Args) => Promise<infer R> ? (...args: Args) => R : never;
export declare type PromiseType<T extends AnyPromise> = T extends Promise<infer R> ? R : never;
export interface MainToWorkerMessage<T extends unknown[]> {
    sharedBuffer: SharedArrayBuffer;
    id: number;
    args: T;
}
export interface WorkerData {
    workerPort: MessagePort;
}
export interface DataMessage<T> {
    result?: T;
    error?: unknown;
    properties?: unknown;
}
export interface WorkerToMainMessage<T = unknown> extends DataMessage<T> {
    id: number;
}
