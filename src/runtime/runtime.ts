import * as lib from './lib';
import TemplateError from './TemplateError';
export {SafeString,markSafe,suppressValue} from './SafeString';
export {isArray,inOperator,keys} from './lib';
export {default as Frame} from './Frame';


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
//console.log('memberLookup val:',val,'obj:',obj);

	if (obj === undefined || obj === null) 
		return undefined;

	if (typeof obj[val] === 'function') 
		return async (...args) => await obj[val].apply(obj, args);

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

export function handleError(error,template,lineno,colno) 
{
	if (error.lineno)    //XXX huh?  maybe try 'instanceof TemplateError'. Still dont like it though
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

