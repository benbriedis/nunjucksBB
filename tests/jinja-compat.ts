import { jinjaEqual as equal } from './util';


describe('jinja-compat', function() {
	var arr = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

	it('should support array slices with start and stop', async () => {
		await equal('{% for i in arr[1:4] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'bcd');
	});
	it('should support array slices using expressions', async () => {
		await equal('{% for i in arr[n:n+3] %}{{ i }}{% endfor %}', {
				n: 1,
				arr: arr
			},
			'bcd');
	});
	it('should support array slices with start', async () => {
		await equal('{% for i in arr[3:] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'defgh');
	});
	it('should support array slices with negative start', async () => {
		await equal('{% for i in arr[-3:] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'fgh');
	});
	it('should support array slices with stop', async () => {
		await equal('{% for i in arr[:4] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'abcd');
	});
	it('should support array slices with negative stop', async () => {
		await equal('{% for i in arr[:-3] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'abcde');
	});
	it('should support array slices with step', async () => {
		await equal('{% for i in arr[::2] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'aceg');
	});
	it('should support array slices with negative step', async () => {
		await equal('{% for i in arr[::-1] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'hgfedcba');
	});
	it('should support array slices with start and negative step', async () => {
		await equal('{% for i in arr[4::-1] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'edcba');
	});
	it('should support array slices with negative start and negative step', async () => {
		await equal('{% for i in arr[-5::-1] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'dcba');
	});
	it('should support array slices with stop and negative step', async () => {
		await equal('{% for i in arr[:3:-1] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'hgfe');
	});
	it('should support array slices with start and step', async () => {
		await equal('{% for i in arr[1::2] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'bdfh');
	});
	it('should support array slices with start, stop, and step', async () => {
		await equal('{% for i in arr[1:7:2] %}{{ i }}{% endfor %}', {
				arr: arr
			},
			'bdf');
	});
});
