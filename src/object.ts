
// A simple class system, more documentation to come
import EventEmitter from 'events';
import * as lib from './lib';

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

export abstract class Obj 
{
//XXX remove 'get'? Make abstract?
	get typename() 
	{
		return this.constructor.name;
	}

//XXX remove extend?
	static extend(name, props=undefined):any
	{
		if (typeof name === 'object') {
			props = name;
			name = 'anonymous';
		}
		return extendClass(this, name, props);
	}
}


//XXX BB cf using Typescript mixins instead for emitting and regular classes or generics for extending
//XXX note EventEmitter is a Node.js thing

export class EmitterObj extends EventEmitter {
  get typename() {
    return this.constructor.name;
  }

  static extend(name, props):any {
    if (typeof name === 'object') {
      props = name;
      name = 'anonymous';
    }
    return extendClass(this, name, props);
  }
}

export default { Obj: Obj, EmitterObj: EmitterObj };

