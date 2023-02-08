import 'mocha';
import {equal} from './util';

export function runLoopTests() {
	describe('the for tag', 
		function() 
	{
		it('should loop over simple arrays', async () => {
			await equal(
				'{% for i in arr %}{{ i }}{% endfor %}', {
					arr: [1, 2, 3, 4, 5]
				},
				'12345');
		});
		it('should loop normally with an {% else %} tag and non-empty array', async () => {
			await equal(
				'{% for i in arr %}{{ i }}{% else %}empty{% endfor %}', {
					arr: [1, 2, 3, 4, 5]
				},
				'12345');
		});
		it('should execute the {% else %} block when looping over an empty array', async () => {
			await equal(
				'{% for i in arr %}{{ i }}{% else %}empty{% endfor %}', {
					arr: []
				},
				'empty');
		});
		it('should support destructured looping', async () => {
			await equal(
				'{% for a, b, c in arr %}' +
				'{{ a }},{{ b }},{{ c }}.{% endfor %}', {
					arr: [
						['x', 'y', 'z'],
						['1', '2', '3']
					]
				},
				'x,y,z.1,2,3.');
		});
		it('should do loop over key-values of a literal in-template Object', async () => {
			await equal(
				'{% for k, v in { one: 1, two: 2 } %}' +
				'-{{ k }}:{{ v }}-{% endfor %}', '-one:1--two:2-');
		});
		it('should support loop.index', async () => {
			await equal('{% for i in [7,3,6] %}{{ loop.index }}{% endfor %}', '123');
		});
		it('should support loop.index0', async () => {
			await equal('{% for i in [7,3,6] %}{{ loop.index0 }}{% endfor %}', '012');
		});
		it('should support loop.revindex', async () => {
			await equal('{% for i in [7,3,6] %}{{ loop.revindex }}{% endfor %}', '321');
		});
		it('should support loop.revindex0', async () => {
			await equal('{% for i in [7,3,6] %}{{ loop.revindex0 }}{% endfor %}', '210');
		});
		it('should support loop.first', async () => {
			await equal(
				'{% for i in [7,3,6] %}' +
				'{% if loop.first %}{{ i }}{% endif %}' +
				'{% endfor %}',
				'7');
		});
		it('should support loop.last', async () => {
			await equal(
				'{% for i in [7,3,6] %}' +
				'{% if loop.last %}{{ i }}{% endif %}' +
				'{% endfor %}',
				'6');
		});
		it('should support loop.length', async () => {
			await equal('{% for i in [7,3,6] %}{{ loop.length }}{% endfor %}', '333');
		});
		it('should fail silently when looping over an undefined variable', async () => {
			await equal('{% for i in foo %}{{ i }}{% endfor %}', '');
		});
		it('should fail silently when looping over an undefined property', async () => {
			await equal(
				'{% for i in foo.bar %}{{ i }}{% endfor %}', {
					foo: {}
				},
				'');
		});
		// TODO: this behavior differs from jinja2
		it('should fail silently when looping over a null variable', async () => {
			await equal(
				'{% for i in foo %}{{ i }}{% endfor %}', {
					foo: null
				},
				'');
		});
		it('should loop over two-dimensional arrays', async () => {
			await equal('{% for x, y in points %}[{{ x }},{{ y }}]{% endfor %}', {
					points: [
						[1, 2],
						[3, 4],
						[5, 6]
					]
				},
				'[1,2][3,4][5,6]');
		});
		it('should loop over four-dimensional arrays', async () => {
			await equal(
				'{% for a, b, c, d in arr %}[{{ a }},{{ b }},{{ c }},{{ d }}]{% endfor %}', {
					arr: [
						[1, 2, 3, 4],
						[5, 6, 7, 8]
					]
				},
				'[1,2,3,4][5,6,7,8]');
		});
		it('should support loop.index with two-dimensional loops', async () => {
			await equal('{% for x, y in points %}{{ loop.index }}{% endfor %}', {
					points: [
						[1, 2],
						[3, 4],
						[5, 6]
					]
				},
				'123');
		});
		it('should support loop.revindex with two-dimensional loops', async () => {
			await equal('{% for x, y in points %}{{ loop.revindex }}{% endfor %}', {
					points: [
						[1, 2],
						[3, 4],
						[5, 6]
					]
				},
				'321');
		});
		it('should support key-value looping over an Object variable', async () => {
			await equal('{% for k, v in items %}({{ k }},{{ v }}){% endfor %}', {
					items: {
						foo: 1,
						bar: 2
					}
				},
				'(foo,1)(bar,2)');
		});
		it('should support loop.index when looping over an Object\'s key-value pairs', async () => {
			await equal('{% for k, v in items %}{{ loop.index }}{% endfor %}', {
					items: {
						foo: 1,
						bar: 2
					}
				},
				'12');
		});
		it('should support loop.revindex when looping over an Object\'s key-value pairs', async () => {
			await equal('{% for k, v in items %}{{ loop.revindex }}{% endfor %}', {
					items: {
						foo: 1,
						bar: 2
					}
				},
				'21');
		});
		it('should support loop.length when looping over an Object\'s key-value pairs', async () => {
			await equal('{% for k, v in items %}{{ loop.length }}{% endfor %}', {
					items: {
						foo: 1,
						bar: 2
					}
				},
				'22');
		});
		it('should support include tags in the body of the loop', async () => {
			await equal('{% for item, v in items %}{% include "item.njk" %}{% endfor %}', {
					items: {
						foo: 1,
						bar: 2
					}
				},
				'showing fooshowing bar');
		});
		it('should work with {% set %} and {% include %} tags', async () => {
			await equal(
				'{% set item = passed_var %}' +
				'{% include "item.njk" %}\n' +
				'{% for i in passed_iter %}' +
				'{% set item = i %}' +
				'{% include "item.njk" %}\n' +
				'{% endfor %}', {
					passed_var: 'test',
					passed_iter: ['1', '2', '3']
				},
				'showing test\nshowing 1\nshowing 2\nshowing 3\n');
		});
		/* global Set */
		it('should work with Set builtin', async () => {
			await equal('{% for i in set %}{{ i }}{% endfor %}', {
					set: new Set([1, 2, 3, 4, 5])
				},
				'12345');

			await equal('{% for i in set %}{{ i }}{% else %}empty{% endfor %}', {
					set: new Set([1, 2, 3, 4, 5])
				},
				'12345');

			await equal('{% for i in set %}{{ i }}{% else %}empty{% endfor %}', {
					set: new Set()
				},
				'empty');
		});
		/* global Map */
		it('should work with Map builtin', async () => {
			await equal('{% for k, v in map %}[{{ k }},{{ v }}]{% endfor %}', {
					map: new Map([
						[1, 2],
						[3, 4],
						[5, 6]
					])
				},
				'[1,2][3,4][5,6]');

			await equal('{% for k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% endfor %}', {
					map: new Map([
						[1, 2],
						[3, 4],
						[5, 6]
					])
				},
				'[1,2][3,4][5,6]');

			await equal('{% for k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% endfor %}', {
					map: new Map()
				},
				'empty');
		});
	});
}

