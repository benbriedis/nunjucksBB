import * as lib from './lib';
import * as runtime from './runtime';
import TemplateError from './TemplateError';
import SafeString,{copySafeness,markSafe} from './SafeString';
import type Context from './context';
import Environment from './environment';


// For the jinja regexp, see
// https://github.com/mitsuhiko/jinja2/blob/f15b814dcba6aa12bc74d1f7d0c881d55f7126be/jinja2/utils.py#L20-L23
const puncRe = /^(?:\(|<|&lt;)?(.*?)(?:\.|,|\)|\n|&gt;)?$/;
// from http://blog.gerv.net/2011/05/html5_email_address_regexp/
const emailRe = /^[\w.!#$%&'*+\-\/=?\^`{|}~]+@[a-z\d\-]+(\.[a-z\d\-]+)+$/i;
const httpHttpsRe = /^https?:\/\/.*$/;
const wwwRe = /^www\./;
const tldRe = /\.(?:org|net|com)(?:\:|\/|$)/;


export default class Filters 
{
	/* 'this' is actually a Context as it it called dynamically from compiled code */

	async abs(value)
	{
		return Math.abs(value);
	}

	async batch(arr, linecount, fillWith) 
	{
		var i;
		var res = [];
		var tmp = [];

		for (i = 0; i < arr.length; i++) {
			if (i % linecount === 0 && tmp.length) {
				res.push(tmp);
				tmp = [];
			}
			tmp.push(arr[i]);
		}

		if (tmp.length) {
			if (fillWith) 
				for (i = tmp.length; i < linecount; i++) 
					tmp.push(fillWith);
			res.push(tmp);
		}

		return res;
	}

	async capitalize(str) 
	{
		str = normalize(str, '');
		const ret = str.toLowerCase();
		return copySafeness(str, ret.charAt(0).toUpperCase() + ret.slice(1));
	}

	async center(str,width) 
	{
		str = normalize(str, '');
		width = width || 80;

		if (str.length >= width) {
			return str;
		}

		const spaces = width - str.length;
		const pre = lib.repeat(' ', (spaces / 2) - (spaces % 2));
		const post = lib.repeat(' ', spaces / 2);
		return copySafeness(str, pre + str + post);
	}

	async 'default'(val,def) 
	{
		return val!=null ? val : def;
	}

	async d(val,def) 
	{
		return env(this).filters['default'](val,def);
	}


	async dictsort(val, caseSensitive, by) 
	{
		if (!lib.isObject(val)) 
			throw new TemplateError('dictsort filter: val must be an object','TODO',-1,-1);  //FIXME params

		let array = [];
		// deliberately include properties from the object's prototype
		for (let k in val) // eslint-disable-line guard-for-in, no-restricted-syntax
			array.push([k, val[k]]);

		let si;
		if (by === undefined || by === 'key') 
			si = 0;
		else if (by === 'value') 
			si = 1;
		else 
			throw new TemplateError(
				'dictsort filter: You can only sort by either key or value','TODO',-1,-1);

		array.sort((t1, t2) => {
			var a = t1[si];
			var b = t2[si];

			if (!caseSensitive) {
				if (lib.isString(a)) 
					a = a.toUpperCase();
				if (lib.isString(b)) 
					b = b.toUpperCase();
			}
			return a > b ? 1 : (a === b ? 0 : -1); // eslint-disable-line no-nested-ternary
		});

		return array;
	}

	async dump(obj, spaces) 
	{
		return JSON.stringify(obj, null, spaces);
	}

	async 'escape'(str) 
	{
		if (str instanceof SafeString) 
			return str;
		str = (str === null || str === undefined) ? '' : str;
		return markSafe(lib.escape(str.toString()));
	}

	async e(str)
	{
		return this['escape'](str);
	}

	async safe(str) 
	{
		if (str instanceof SafeString) 
			return str;
		str = (str === null || str === undefined) ? '' : str;
		return markSafe(str.toString());
	}

	async first(arr) 
	{
		return arr[0];
	}

	async 'float'(val, def) 
	{
		var res = parseFloat(val);
		return (isNaN(res)) ? def : res;
	}

	async forceescape(str) 
	{
		str = (str === null || str === undefined) ? '' : str;
		return markSafe(lib.escape(str.toString()));
	}

	async groupby(arr, attr) 
	{
		return lib.groupBy(arr, attr, env(this).opts.throwOnUndefined);
	}

	async indent(str, width, indentfirst) 
	{
		str = normalize(str, '');

		if (str === '') 
			return '';

		width = width || 4;
		// let res = '';
		const lines = str.split('\n');
		const sp = lib.repeat(' ', width);

		const res = lines.map((l, i) => {
			return (i === 0 && !indentfirst) ? l : `${sp}${l}`;
		}).join('\n');

		return copySafeness(str, res);
	}

	'int' = runtime.makeMacro(
		['value', 'default', 'base'],
		[],
		function doInt(value, defaultValue, base = 10) {
			var res = parseInt(value, base);
			return (isNaN(res)) ? defaultValue : res;
		}
	);

	async join(arr, del, attr) 
	{
		del = del || '';

		if (attr) 
			arr = lib.map(arr, (v) => v[attr]);

		return arr.join(del);
	}

	async last(arr) 
	{
		return arr[arr.length - 1];
	}

	async length(val) 
	{
		var value = normalize(val, '');

		if (value !== undefined) {
			if (
				(typeof Map === 'function' && value instanceof Map) ||
				(typeof Set === 'function' && value instanceof Set)
			) 
				// ECMAScript 2015 Maps and Sets
				return value.size;

			if (lib.isObject(value) && !(value instanceof SafeString)) 
				// Objects (besides SafeStrings), non-primative Arrays
				return lib.keys(value).length;

			return value.length;
		}
		return 0;
	}

	async list(val) 
	{
		if (lib.isString(val)) 
			return val.split('');
		else if (lib.isObject(val)) 
			return lib._entries(val || {}).map(([key, value]) => ({
				key,
				value
			}));
		else if (lib.isArray(val)) 
			return val;
		else 
			throw new TemplateError('list filter: type not iterable','TODO',-1,-1);
	}

	async lower(str) 
	{
		str = normalize(str, '');
		return str.toLowerCase();
	}

	async nl2br(str) 
	{
		if (str === null || str === undefined) 
			return '';
		return copySafeness(str, str.replace(/\r\n|\n/g, '<br />\n'));
	}

	async random(arr) 
	{
		return arr[Math.floor(Math.random() * arr.length)];
	}

	async reject(arr, testName = 'truthy', secondArg)
	{
		const context = this;
		const test = env(this).getTest(testName);
//QQQQ
		return lib.toArray(arr).filter(function examineTestResult(item) {
			return test.call(context, item, secondArg) === false;
		});
	}

	async rejectattr(arr, attr) 
	{
		return arr.filter((item) => !item[attr]);
	}

	async select(arr, testName = 'truthy', secondArg)
	{
		const context = this;
		const test = env(this).getTest(testName);
//QQQQ		

		return lib.toArray(arr).filter(function examineTestResult(item) {
			return test.call(context, item, secondArg) === true;
		});
	}

	async selectattr(arr, attr) 
	{
		return arr.filter((item) => !!item[attr]);
	}

//XXX should str and/or old be (optionally) SafeString?
	async replace(str:string, old, new_, maxCount:number) 
	{
		var originalStr = str;

		if (old instanceof RegExp) 
			return str.replace(old, new_);

		if (typeof maxCount === 'undefined') 
			maxCount = -1;

		let res = ''; // Output

		// Cast Numbers in the search term to string
		if (typeof old === 'number') 
			old = '' + old;
		else if (typeof old !== 'string') 
			// If it is something other than number or string,
			// return the original string
			return str;

		// Cast numbers in the replacement to string
		if (typeof str === 'number') 
			str = '' + str;

		// If by now, we don't have a string, throw it back
		if (typeof str !== 'string' && !(<any>str instanceof SafeString))   //XXX nasty cast
			return str;

		// ShortCircuits
		if (old === '') {
			// Mimic the python behaviour: empty string is replaced
			// by replacement e.g. "abc"|replace("", ".") -> .a.b.c.
			res = new_ + str.split('').join(new_) + new_;
			return copySafeness(str, res);
		}

		let nextIndex = str.indexOf(old);
		// if # of replacements to perform is 0, or the string to does
		// not contain the old value, return the string
		if (maxCount === 0 || nextIndex === -1) 
			return str;

		let pos = 0;
		let count = 0; // # of replacements made

		while (nextIndex > -1 && (maxCount === -1 || count < maxCount)) {
			// Grab the next chunk of src string and add it with the
			// replacement, to the result
			res += str.substring(pos, nextIndex) + new_;
			// Increment our pointer in the src string
			pos = nextIndex + old.length;
			count++;
			// See if there are any more replacements to be made
			nextIndex = str.indexOf(old, pos);
		}

		// We've either reached the end, or done the max # of
		// replacements, tack on any remaining string
		if (pos < str.length) 
			res += str.substring(pos);

		return copySafeness(originalStr, res);
	}

	async reverse(val) 
	{
		var arr;
		if (lib.isString(val)) 
			arr = await env(this).filters.list(val);
		else 
			// Copy it
			arr = lib.map(val, v => v);

		arr.reverse();

		if (lib.isString(val)) 
			return copySafeness(val, arr.join(''));

		return arr;
	}

	async round(val, precision, method) 
	{
		precision = precision || 0;
		const factor = Math.pow(10, precision);
		let rounder;

		if (method === 'ceil') 
			rounder = Math.ceil;
		else if (method === 'floor') 
			rounder = Math.floor;
		else 
			rounder = Math.round;

		return rounder(val * factor) / factor;
	}

	async slice(arr, slices, fillWith) 
	{
		const sliceLength = Math.floor(arr.length / slices);
		const extra = arr.length % slices;
		const res = [];
		let offset = 0;

		for (let i = 0; i < slices; i++) {
			const start = offset + (i * sliceLength);
			if (i < extra) 
				offset++;
			const end = offset + ((i + 1) * sliceLength);

			const currSlice = arr.slice(start, end);
			if (fillWith && i >= extra) 
				currSlice.push(fillWith);
			res.push(currSlice);
		}

		return res;
	}

	async sum(arr, attr, start = 0) 
	{
		if (attr) 
			arr = lib.map(arr, (v) => v[attr]);

		return start + arr.reduce((a, b) => a + b, 0);
	}

//XXX this weird syntax allows for named function arguments. Only seems to be supported for sort() and int(),
//    as weel as custom macros

	sort = runtime.makeMacro(
		['value', 'reverse', 'case_sensitive', 'attribute'], [],
		function sortFilter(arr, reversed, caseSens, attr) {
			// Copy it
			let array = lib.map(arr, v => v);
			let getAttribute = lib.getAttrGetter(attr);

			array.sort((a, b) => {
				let x = attr ? getAttribute(a) : a;
				let y = attr ? getAttribute(b) : b;

				if (
					env(this).opts.throwOnUndefined &&
					attr && (x === undefined || y === undefined)
				) 
					throw new TypeError(`sort: attribute "${attr}" resolved to undefined`);

				if (!caseSens && lib.isString(x) && lib.isString(y)) {
					x = x.toLowerCase();
					y = y.toLowerCase();
				}

				if (x < y) 
					return reversed ? 1 : -1;
				else if (x > y) 
					return reversed ? -1 : 1;
				else 
					return 0;
			});

			return array;
		}
	);

	async 'string'(obj) 
	{
		return copySafeness(obj, obj);
	}

	async striptags(input:string, preserveLinebreaks:boolean) 
	{
		input = normalize(input, '');
		let tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>|<!--[\s\S]*?-->/gi;
		let trimmedInput = await env(this).filters.trim(input.replace(tags, ''));
		let res = '';
		if (preserveLinebreaks) 
			res = trimmedInput
				.replace(/^ +| +$/gm, '') // remove leading and trailing spaces
				.replace(/ +/g, ' ') // squash adjacent spaces
				.replace(/(\r\n)/g, '\n') // normalize linebreaks (CRLF -> LF)
				.replace(/\n\n\n+/g, '\n\n'); // squash abnormal adjacent linebreaks
		else 
			res = trimmedInput.replace(/\s+/gi, ' ');

		return copySafeness(input, res);
	}

	async title(str) 
	{
		str = normalize(str, '');
		let out = [];
		for (const word of str.split(' ')) 
			out.push(await env(this).filters.capitalize(word)); 

		return copySafeness(str, out.join(' '));
	}

	async trim(str) 
	{
		return copySafeness(str, str.replace(/^\s*|\s*$/g, ''));
	}

	async truncate(input, length, killwords, end) 
	{
		var orig = input;
		input = normalize(input, '');
		length = length || 255;

		if (input.length <= length) 
			return input;

		if (killwords) 
			input = input.substring(0, length);
		else {
			let idx = input.lastIndexOf(' ', length);
			if (idx === -1) 
				idx = length;

			input = input.substring(0, idx);
		}

		input += (end !== undefined && end !== null) ? end : '...';
		return copySafeness(orig, input);
	}

	async upper(str) 
	{
		str = normalize(str, '');
		return str.toUpperCase();
	}

	async urlencode(obj) 
	{
		var enc = encodeURIComponent;
		if (lib.isString(obj)) 
			return enc(obj);
		else {
			let keyvals = (lib.isArray(obj)) ? obj : lib._entries(obj);
			return keyvals.map(([k, v]) => `${enc(k)}=${enc(v)}`).join('&');
		}
	}

	async urlize(str, length, nofollow) 
	{
		if (isNaN(length)) 
			length = Infinity;

		const noFollowAttr = (nofollow === true ? ' rel="nofollow"' : '');

		const words = str.split(/(\s+)/).filter((word) => {
			// If the word has no length, bail. This can happen for str with
			// trailing whitespace.
			return word && word.length;
		}).map((word) => {
			var matches = word.match(puncRe);
			var possibleUrl = (matches) ? matches[1] : word;
			var shortUrl = possibleUrl.substr(0, length);

			// url that starts with http or https
			if (httpHttpsRe.test(possibleUrl)) 
				return `<a href="${possibleUrl}"${noFollowAttr}>${shortUrl}</a>`;

			// url that starts with www.
			if (wwwRe.test(possibleUrl)) 
				return `<a href="http://${possibleUrl}"${noFollowAttr}>${shortUrl}</a>`;

			// an email address of the form username@domain.tld
			if (emailRe.test(possibleUrl)) 
				return `<a href="mailto:${possibleUrl}">${possibleUrl}</a>`;

			// url that ends in .com, .org or .net that is not an email address
			if (tldRe.test(possibleUrl)) 
				return `<a href="http://${possibleUrl}"${noFollowAttr}>${shortUrl}</a>`;

			return word;
		});

		return words.join('');
	}

	async wordcount(str) 
	{
		str = normalize(str, '');
		const words = str ? str.match(/\w+/g) : null;
		return words ? words.length : null;
	}
}


function env(thisObj:Filters):Environment
{
	return (<Context><unknown>thisObj).env;
}

function normalize(value,defaultValue) 
{
	if (value === null || value === undefined || value === false) 
		return defaultValue;
	return value;
}

function isNaN(num) 
{
	return num !== num; // eslint-disable-line no-self-compare
}

