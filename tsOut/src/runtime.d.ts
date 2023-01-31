export function makeMacro(argNames: any, kwargNames: any, func: any): (...macroArgs: any[]) => any;
export function makeKeywordArgs(obj: any): any;
export function isKeywordArgs(obj: any): any;
export function getKeywordArgs(args: any): any;
export function numArgs(args: any): any;
export function SafeString(val: any): any;
export class SafeString {
    constructor(val: any);
    val: string;
    length: number;
    valueOf(): string;
    toString(): string;
}
export function copySafeness(dest: any, target: any): any;
export function markSafe(val: any): any;
export function suppressValue(val: any, autoescape: any): any;
export function ensureDefined(val: any, lineno: any, colno: any): any;
export function memberLookup(obj: any, val: any): any;
export function callWrap(obj: any, name: any, context: any, args: any): any;
export function contextOrFrameLookup(context: any, frame: any, name: any): any;
export function handleError(error: any, lineno: any, colno: any): any;
export function asyncEach(arr: any, dimen: any, iter: any, cb: any): void;
export function asyncAll(arr: any, dimen: any, func: any, cb: any): void;
export function fromIterator(arr: any): any;
export class Frame {
    constructor(parent: any, isolateWrites: any);
    variables: any;
    parent: any;
    topLevel: boolean;
    isolateWrites: any;
    set(name: any, val: any, resolveUp: any): void;
    get(name: any): any;
    lookup(name: any): any;
    resolve(name: any, forWrite: any): any;
    push(isolateWrites: any): Frame;
    pop(): any;
}
declare namespace _default {
    export { Frame };
    export { makeMacro };
    export { makeKeywordArgs };
    export { numArgs };
    export { suppressValue };
    export { ensureDefined };
    export { memberLookup };
    export { contextOrFrameLookup };
    export { callWrap };
    export { handleError };
    export const isArray: typeof lib.isArray;
    export const keys: typeof lib.keys;
    export { SafeString };
    export { copySafeness };
    export { markSafe };
    export { asyncEach };
    export { asyncAll };
    export const inOperator: typeof lib.inOperator;
    export { fromIterator };
}
export default _default;
import lib = require("./lib");
//# sourceMappingURL=runtime.d.ts.map