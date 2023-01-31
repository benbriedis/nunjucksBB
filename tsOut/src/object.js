'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmitterObj2 = exports.EmitterObj = exports.Obj2 = exports.Obj = void 0;
// A simple class system, more documentation to come
const EventEmitter = require('events');
const lib = require('./lib');
function parentWrap(parent, prop) {
    if (typeof parent !== 'function' || typeof prop !== 'function') {
        return prop;
    }
    return function wrap() {
        // Save the current parent method
        const tmp = this.parent;
        // Set parent to the previous method, call, and restore
        this.parent = parent;
        const res = prop.apply(this, arguments);
        this.parent = tmp;
        return res;
    };
}
function extendClass(cls, name, props) {
    props = props || {};
    lib.keys(props).forEach(k => {
        props[k] = parentWrap(cls.prototype[k], props[k]);
    });
    class subclass extends cls {
        //BB: seems to be necessary to keep TS happy wrt variable parameters
        constructor(...args) {
            super(...args);
        }
        get typename() {
            return name;
        }
    }
    lib._assign(subclass.prototype, props);
    return subclass;
}
class Obj {
    constructor(...args) {
        // Unfortunately necessary for backwards compatibility
        this.init(...args);
    }
    init(...args) { }
    get typename() {
        return this.constructor.name;
    }
    static extend(name, props = undefined) {
        if (typeof name === 'object') {
            props = name;
            name = 'anonymous';
        }
        return extendClass(this, name, props);
    }
}
exports.Obj = Obj;
class Obj2 {
    //XXX remove 'get'? Make abstract?
    get typename() {
        return this.constructor.name;
    }
    //XXX remove extend?
    static extend(name, props = undefined) {
        if (typeof name === 'object') {
            props = name;
            name = 'anonymous';
        }
        return extendClass(this, name, props);
    }
}
exports.Obj2 = Obj2;
//XXX BB cf using Typescript mixins instead for emitting and regular classes or
//       generics for extending
//XXX Are these things used in the compiled versions?
//XXX note EventEmitter is a Node.js thing
class EmitterObj extends EventEmitter {
    constructor(...args) {
        super();
        // Unfortunately necessary for backwards compatibility
        this.init(...args);
    }
    init(...args) { }
    get typename() {
        return this.constructor.name;
    }
    static extend(name, props) {
        if (typeof name === 'object') {
            props = name;
            name = 'anonymous';
        }
        return extendClass(this, name, props);
    }
}
exports.EmitterObj = EmitterObj;
class EmitterObj2 extends EventEmitter {
    get typename() {
        return this.constructor.name;
    }
    static extend(name, props) {
        if (typeof name === 'object') {
            props = name;
            name = 'anonymous';
        }
        return extendClass(this, name, props);
    }
}
exports.EmitterObj2 = EmitterObj2;
exports.default = { Obj, Obj2, EmitterObj, EmitterObj2 };
//# sourceMappingURL=object.js.map