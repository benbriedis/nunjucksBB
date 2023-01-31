declare const EventEmitter: any;
export declare class Obj {
    constructor(...args: any[]);
    init(...args: any[]): void;
    get typename(): string;
    static extend(name: any, props?: any): any;
}
export declare abstract class Obj2 {
    get typename(): string;
    static extend(name: any, props?: any): any;
}
export declare class EmitterObj extends EventEmitter {
    constructor(...args: any[]);
    init(...args: any[]): void;
    get typename(): string;
    static extend(name: any, props: any): any;
}
export declare class EmitterObj2 extends EventEmitter {
    get typename(): string;
    static extend(name: any, props: any): any;
}
declare const _default: {
    Obj: typeof Obj;
    Obj2: typeof Obj2;
    EmitterObj: typeof EmitterObj;
    EmitterObj2: typeof EmitterObj2;
};
export default _default;
//# sourceMappingURL=object.d.ts.map