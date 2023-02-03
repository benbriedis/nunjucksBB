function _cycler(items) 
{
	var index = -1;
	return {
		current: null,
		reset: function reset() {
			index = -1;
			this.current = null;
		},
		next: function next() {
			index++;
			if (index >= items.length) 
				index = 0;
			this.current = items[index];
			return this.current;
		}
	};
}

function _joiner(sep) 
{
	sep = sep || ',';
	var first = true;
	return function() {
		var val = first ? '' : sep;
		first = false;
		return val;
	};
}

export default class Globals 
{
	constructor()
	{
	}

	range(start, stop, step) 
	{
		if (typeof stop === 'undefined') {
			stop = start;
			start = 0;
			step = 1;
		} else if (!step) 
			step = 1;

		var arr = [];
		if (step > 0)
			for (var i = start; i < stop; i += step) 
				arr.push(i);
		else 
			for (var _i = start; _i > stop; _i += step) 
				// eslint-disable-line for-direction
				arr.push(_i);
		return arr;
	}

	cycler() 
	{
		return _cycler(Array.prototype.slice.call(arguments));
	}

	joiner(sep) 
	{
		return _joiner(sep);
	}
}

