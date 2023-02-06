import * as lib from './lib';
import TemplateError from './TemplateError';
export {isArray,inOperator} from './lib';


var arrayFrom = Array.from;
var supportsIterators = (
	typeof Symbol === 'function' && Symbol.iterator && typeof arrayFrom === 'function'
);


// Frames keep track of scoping both at compile-time and run-time so
// we know how to access variables. Block tags can introduce special
// variables, for example.
export class Frame 
{
	variables;
	parent;
	topLevel:boolean = false;
	// if this is true, writes (set) should never propagate upwards past
	// this frame to its parent (though reads may).
	isolateWrites;


	constructor(parent=undefined, isolateWrites=undefined) 
	{
		this.variables = Object.create(null);
		this.parent = parent;
		this.isolateWrites = isolateWrites;
	}

	set(name, val, resolveUp) 
	{
		// Allow variables with dots by automatically creating the
		// nested structure
		var parts = name.split('.');
		var obj = this.variables;
		var frame = this;

		if (resolveUp) {
			if ((frame = this.resolve(parts[0], true))) {
//				frame.set(name, val);
				frame.set[name] = val;
				return;
			}
		}

		for (let i = 0; i < parts.length - 1; i++) {
			const id = parts[i];

			if (!obj[id]) 
				obj[id] = {};
			obj = obj[id];
		}

		obj[parts[parts.length - 1]] = val;
	}

	get(name) 
	{
		var val = this.variables[name];
		if (val !== undefined) 
			return val;
		return null;
	}

	lookup(name) 
	{
		var p = this.parent;
		var val = this.variables[name];
		if (val !== undefined) 
			return val;
		return p && p.lookup(name);
	}

	resolve(name, forWrite) 
	{
		var p = (forWrite && this.isolateWrites) ? undefined : this.parent;
		var val = this.variables[name];
		if (val !== undefined) 
			return this;
		return p && p.resolve(name);
	}

	push(isolateWrites) 
	{
		return new Frame(this, isolateWrites);
	}

	pop() 
	{
		return this.parent;
	}
}



export function makeMacro(argNames, kwargNames, /*async*/ func) {
	return async function macro(...macroArgs) {
		var argCount = numArgs(macroArgs);
		var args;
		var kwargs = getKeywordArgs(macroArgs);

		if (argCount > argNames.length) {
			args = macroArgs.slice(0, argNames.length);

			// Positional arguments that should be passed in as
			// keyword arguments (essentially default values)
			macroArgs.slice(args.length, argCount).forEach((val, i) => {
				if (i < kwargNames.length) 
					kwargs[kwargNames[i]] = val;
			});
			args.push(kwargs);
		} else if (argCount < argNames.length) {
			args = macroArgs.slice(0, argCount);

			for (let i = argCount; i < argNames.length; i++) {
				const arg = argNames[i];

				// Keyword arguments that should be passed as
				// positional arguments, i.e. the caller explicitly
				// used the name of a positional arg
				args.push(kwargs[arg]);
				delete kwargs[arg];
			}
			args.push(kwargs);
		} else 
			args = macroArgs;

		return await func.apply(this, args);
	};
}

export function makeKeywordArgs(obj) 
{
	obj.__keywords = true;
	return obj;
}

export function isKeywordArgs(obj) 
{
	return obj && Object.prototype.hasOwnProperty.call(obj, '__keywords');
}

export function getKeywordArgs(args) 
{
	var len = args.length;
	if (len) {
		const lastArg = args[len - 1];
		if (isKeywordArgs(lastArg)) 
			return lastArg;
	}
	return {};
}

export function numArgs(args) 
{
	var len = args.length;
	if (len === 0) 
		return 0;

	const lastArg = args[len - 1];
	if (isKeywordArgs(lastArg)) 
		return len - 1;
	else 
		return len;
}

// A SafeString object indicates that the string should not be
// autoescaped. This happens magically because autoescaping only
// occurs on primitive string objects.
export class SafeString
{
	val;
	length;

	constructor(val)
	{
		if (typeof val !== 'string') 
			return val;
		this.val = val;
		this.length = val.length;
	}

	valueOf()
	{
		return this.val;
	}

	toString()
	{
		return this.val;
	}

/*
	length()
	{
		return {
			writable: true,
			configurable: true,
			value: 0
		};
	}
*/	
}

//TODO move into SafeString...

export function copySafeness(dest, target) 
{
	if (dest instanceof SafeString) 
		return new SafeString(target);
	return target.toString();
}

export function markSafe(val) 
{
	var type = typeof val;

	if (type === 'string') 
		return new SafeString(val);
	else if (type !== 'function') 
		return val;
	else {
		return function wrapSafe(args) {
			var ret = val.apply(this, arguments);

			if (typeof ret === 'string') 
				return new SafeString(ret);

			return ret;
		};
	}
}

export function suppressValue(val,autoescape) 
{
	val = (val !== undefined && val !== null) ? val : '';

	if (autoescape && !(val instanceof SafeString)) 
		val = lib.escape(val.toString());

	return val;
}

export function ensureDefined(val, lineno, colno) 
{
	if (val === null || val === undefined) {
		throw new TemplateError(
			'attempted to output null or undefined value',
			'TODO', //FIXME 'TODO'
			lineno + 1,
			colno + 1
		);
	}
	return val;
}

export function memberLookup(obj, val) 
{
	if (obj === undefined || obj === null) 
		return undefined;

	if (typeof obj[val] === 'function') 
		return (...args) => obj[val].apply(obj, args);

	return obj[val];
}

export async function callWrap(obj, name, context, args) 
{
	if (!obj) 
		throw new Error('Unable to call `' + name + '`, which is undefined or falsey');
	else if (typeof obj !== 'function') 
		throw new Error('Unable to call `' + name + '`, which is not a function');

	return await obj.apply(context, args);
}

export function contextOrFrameLookup(context, frame, name) 
{
	var val = frame.lookup(name);
	return (val !== undefined) ? val : context.lookup(name);
}

export function handleError(error, template, line, column) 
{
	if (error.line) //XXX YUCK
		return error;
	else
		return new TemplateError(error, template, line, column);
}

export function fromIterator(arr) 
{
	if (typeof arr !== 'object' || arr === null || lib.isArray(arr)) 
		return arr;
	else if (supportsIterators && Symbol.iterator in arr) 
		return arrayFrom(arr);
	else 
		return arr;
}

