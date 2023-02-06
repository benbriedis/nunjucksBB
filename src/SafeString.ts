import * as lib from './lib';

// A SafeString object indicates that the string should not be
// autoescaped. This happens magically because autoescaping only
// occurs on primitive string objects.
export function SafeString(val):void
{
	if (typeof val !== 'string') 
		return val;

	this.val = val;
	this.length = val.length;
}

SafeString.prototype = Object.create(String.prototype, {
	length: {
		writable: true,
		configurable: true,
		value: 0
	}
});

SafeString.prototype.valueOf = function valueOf() {
	return this.val;
};

SafeString.prototype.toString = function toString() {
	return this.val;
};

export default SafeString;


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
		return async function wrapSafe(args) {
			var ret = await val.apply(this, args);

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


