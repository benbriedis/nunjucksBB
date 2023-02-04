
var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;

var escapeMap = {
	'&': '&amp;',
	'"': '&quot;',
	'\'': '&#39;',
	'<': '&lt;',
	'>': '&gt;'
};

var escapeRegex = /[&"'<>]/g;

export function hasOwnProp(obj,k) 
{
	return ObjProto.hasOwnProperty.call(obj, k);
}

function lookupEscape(ch)
{
	return escapeMap[ch];
}

//XXX just incorporate into TemplateError?
export function _prettifyError(path, withInternals, err)
{
console.log('_prettifyError  path:',path);
console.log('_prettifyError  err:',err);
console.log('_prettifyError  err.stack:',err.stack);

	if (!(err instanceof TemplateError)) 
		err = TemplateError.fromError(err,path,-1,-1);  //FIXME params

	// Unless they marked the dev flag, show them a trace from here
	if (!withInternals) {
		const old = err;
		err = new Error(old.message);
		err.name = old.name;
	}

	return err;
}

//TODO BB work on this further. I deleted out the old version - it was too far gone
export class TemplateError
{
	message;
	template;
	line;
	column;

	constructor(message:string,template,line,column) 
	{
		this.message = message;
		this.template = template;
		this.line = line;
		this.column = column;
	}

	static fromError(err:Error,template,line,column)
	{
//TODO copy stack trace over?	
		return new TemplateError(err.toString(),template,line,column);
	}
}

export function escape(val) 
{
	return val.replace(escapeRegex, lookupEscape);
}

export function isFunction(obj) 
{
	return ObjProto.toString.call(obj) === '[object Function]';
}

export function isArray(obj) 
{
	return ObjProto.toString.call(obj) === '[object Array]';
}

export function isString(obj) 
{
	return ObjProto.toString.call(obj) === '[object String]';
}

export function isObject(obj) 
{
	return ObjProto.toString.call(obj) === '[object Object]';
}

/**
 * @param {string|number} attr
 * @returns {(string|number)[]}
 * @private
 */
function _prepareAttributeParts(attr) 
{
	if (!attr) 
		return [];

	if (typeof attr === 'string') 
		return attr.split('.');

	return [attr];
}

/**
 * @param {string}   attribute      Attribute value. Dots allowed.
 * @returns {function(Object): *}
 */
export function getAttrGetter(attribute) 
{
	const parts = _prepareAttributeParts(attribute);

	return function attrGetter(item) {
		let _item = item;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			// If item is not an object, and we still got parts to handle, it means
			// that something goes wrong. Just roll out to undefined in that case.
			if (hasOwnProp(_item, part))
				_item = _item[part];
			else 
				return undefined;
		}
		return _item;
	};
}

export function groupBy(obj, val, throwOnUndefined) 
{
	const result = {};
	const iterator = isFunction(val) ? val : getAttrGetter(val);
	for (let i = 0; i < obj.length; i++) {
		const value = obj[i];
		const key = iterator(value, i);
		if (key === undefined && throwOnUndefined === true) 
			throw new TypeError(`groupby: attribute "${val}" resolved to undefined`);
		(result[key] || (result[key] = [])).push(value);
	}
	return result;
}

export function toArray(obj) 
{
	return Array.prototype.slice.call(obj);
}

export function without(array) 
{
	const result = [];
	if (!array) 
		return result;

	const length = array.length;
	const contains = toArray(arguments).slice(1);
	let index = -1;

	while (++index < length) 
		if (indexOf(contains, array[index]) === -1) 
			result.push(array[index]);

	return result;
}

export function repeat(char_, n) 
{
	var str = '';
	for (let i = 0; i < n; i++) 
		str += char_;
	return str;
}

export function each(obj, func, context) 
{
	if (obj == null) 
		return;

	if (ArrayProto.forEach && obj.forEach === ArrayProto.forEach) 
		obj.forEach(func, context);
	else if (obj.length === +obj.length) 
		for (let i = 0, l = obj.length; i < l; i++) 
			func.call(context, obj[i], i, obj);
}

export function map(obj, func) 
{
	var results = [];
	if (obj == null) 
		return results;

	if (ArrayProto.map && obj.map === ArrayProto.map) 
		return obj.map(func);

	for (let i = 0; i < obj.length; i++) 
		results[results.length] = func(obj[i], i);

	if (obj.length === +obj.length) 
		results.length = obj.length;

	return results;
}


export async function asyncIter(arr, iter, cb)
{
	let i = -1;

	function next() {
		i++;

		if (i < arr.length) 
			iter(arr[i], i, next, cb);
		else 
			cb();
	}
	next();
}


export function asyncFor(obj, iter, cb) 
{
	const keys = keys_(obj || {});
	const len = keys.length;
	let i = -1;

	function next() {
		i++;
		const k = keys[i];

		if (i < len) 
			iter(k, obj[k], i, len, next);
		else 
			cb();
	}
	next();
}


export function indexOf(arr, searchElement, fromIndex=undefined) 
{
	return Array.prototype.indexOf.call(arr || [], searchElement, fromIndex);
}


function keys_(obj) 
{
	/* eslint-disable no-restricted-syntax */
	const arr = [];
	for (let k in obj) 
		if (hasOwnProp(obj, k)) 
			arr.push(k);
	return arr;
}

export {keys_ as keys};


export function _entries(obj) 
{
	return keys_(obj).map((k) => [k, obj[k]]);
}


export function _values(obj) 
{
	return keys_(obj).map((k) => obj[k]);
}


export function extend(obj1, obj2) 
{
	obj1 = obj1 || {};
	keys_(obj2).forEach(k => {
		obj1[k] = obj2[k];
	});
	return obj1;
}

//exports._assign = exports.extend = extend;
const _assign = extend;
export {_assign};


export function inOperator(key, val) 
{
	if (isArray(val) || isString(val))
		return val.indexOf(key) !== -1;
	else if (isObject(val)) 
		return key in val;

	throw new Error('Cannot use "in" operator to search for "' + key + '" in unexpected types.');
}

