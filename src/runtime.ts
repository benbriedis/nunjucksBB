import * as lib from './lib';
import TemplateError from './TemplateError';
export {SafeString,markSafe,suppressValue} from './SafeString';
export {isArray,inOperator,keys} from './lib';
export {Frame} from './Frame';


var arrayFrom = Array.from;
var supportsIterators = (
	typeof Symbol === 'function' && Symbol.iterator && typeof arrayFrom === 'function'
);


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

if (global.go) console.log('IIII makeMacro()  this:',this);
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
if (global.go) console.log('memberLookup()  obj:',obj,'val:',val);
	if (obj === undefined || obj === null) 
		return undefined;

if (global.go) console.log('memberLookup()--2  obj[val]:',obj[val]);

	if (typeof obj[val] === 'function') 
		return (...args) => obj[val].apply(obj, args);

if (global.go) console.log('memberLookup()--3');

	return obj[val];
}

export async function callWrap(obj, name, context, args) 
{
	if (!obj) 
		throw new Error('Unable to call `' + name + '`, which is undefined or falsey');
	else if (typeof obj !== 'function') 
		throw new Error('Unable to call `' + name + '`, which is not a function');

if(global.go) console.log('IIII callWrap() name:',name,'args:',args);

	return await obj.apply(context, args);
}

export function contextOrFrameLookup(context, frame, name) 
{
if (global.go) console.log('IIIII contextOrFrameLookup  name:',name,'CALLING frame.lookup()');	
if (global.go) console.log('IIIII contextOrFrameLookup  frame:',frame);	
	var val = frame.lookup(name);
if (global.go) console.log('IIIII contextOrFrameLookup  name:',name,'typeof val:',typeof val);	
if (global.go) console.log('IIIII contextOrFrameLookup  name:',name,'val1:',val);	
	return (val !== undefined) ? val : context.lookup(name);
}

export function handleError(error,template,lineno,colno) 
{
	if (error.lineno)    //XXX huh?
		throw error;
	else 
		throw new TemplateError(error.message ?? 'unspecified cause',template,lineno,colno);
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

