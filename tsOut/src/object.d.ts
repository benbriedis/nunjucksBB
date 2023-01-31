export class Obj {
    static extend(name: any, props?: any): {
        new (...args: any[]): {
            [x: string]: any;
            readonly typename: any;
        };
        [x: string]: any;
    };
    constructor(...args: any[]);
    init(...args: any[]): void;
    get typename(): string;
}
export class EmitterObj extends EventEmitter {
    static extend(name: any, props: any): {
        new (...args: any[]): {
            [x: string]: any;
            readonly typename: any;
        };
        [x: string]: any;
    };
    constructor(...args: any[]);
    init(...args: any[]): void;
    get typename(): string;
}
import EventEmitter = require("events");
//# sourceMappingURL=object.d.ts.map