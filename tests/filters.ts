import expect from 'expect.js';
import { render, equal } from './util';
import * as lib from '../src/lib';
import * as r from '../src/runtime';
import assert from 'assert';
import TemplateError from '../src/TemplateError';


describe('filter', function() {
	it('abs', async () => {
		await equal('{{ -3|abs }}', '3');
		await equal('{{ -3.456|abs }}', '3.456');
	});

	it('batch', async () => {
		await equal(
			[
				'{% for a in [1,2,3,4,5,6]|batch(2) %}',
				'-{% for b in a %}',
				'{{ b }}',
				'{% endfor %}-',
				'{% endfor %}'
			].join(''),
			'-12--34--56-');
	});

	it('capitalize', async () => {
		await equal('{{ "foo" | capitalize }}', 'Foo');
		await equal('{{ str | capitalize }}', {
			str: r.markSafe('foo')
		}, 'Foo');
		await equal('{{ undefined | capitalize }}', '');
		await equal('{{ null | capitalize }}', '');
		await equal('{{ nothing | capitalize }}', '');
	});

	it('center', async () => {
		await equal('{{ "fooo" | center }}',
			lib.repeat(' ', 38) + 'fooo' +
			lib.repeat(' ', 38));

		await equal('{{ str | center }}', {
				str: r.markSafe('fooo')
			},
			lib.repeat(' ', 38) + 'fooo' + lib.repeat(' ', 38));

		await equal('{{ undefined | center }}',
			lib.repeat(' ', 40) + '' +
			lib.repeat(' ', 40));

		await equal('{{ null | center }}',
			lib.repeat(' ', 40) + '' +
			lib.repeat(' ', 40));

		await equal('{{ nothing | center }}',
			lib.repeat(' ', 40) + '' +
			lib.repeat(' ', 40));

		await equal('{{ "foo" | center }}',
			lib.repeat(' ', 38) + 'foo' +
			lib.repeat(' ', 39));
	});

	it('default', async () => {
		await equal('{{ undefined | default("foo") }}', 'foo');
		await equal('{{ bar | default("foo") }}', { bar:null }, 'foo');
		await equal('{{ false | default("foo") }}', 'false');
		await equal('{{ bar | default("foo") }}', 'foo');
		await equal('{{ "bar" | default("foo") }}', 'bar');
	});

	it('dump', async () => {
		await equal('{{ [\'a\', 1, {b: true}] | dump  }}',
			'[&quot;a&quot;,1,{&quot;b&quot;:true}]');
		await equal('{{ [\'a\', 1, {b: true}] | dump(2) }}',
			'[\n  &quot;a&quot;,\n  1,\n  {\n    &quot;b&quot;: true\n  }\n]');
		await equal('{{ [\'a\', 1, {b: true}] | dump(4) }}',
			'[\n    &quot;a&quot;,\n    1,\n    {\n        &quot;b&quot;: true\n    }\n]');
		await equal('{{ [\'a\', 1, {b: true}] | dump(\'\t\') }}',
			'[\n\t&quot;a&quot;,\n\t1,\n\t{\n\t\t&quot;b&quot;: true\n\t}\n]');
	});

	it('escape', async () => {
		await equal(
			'{{ "<html>" | escape }}', {}, {
				autoescape: false
			},
			'&lt;html&gt;');
	});

	it('escape skip safe', async () => {
		await equal('{{ "<html>" | safe | escape }}', {}, {
				autoescape: false
			},
			'<html>');
	});

	it('should not double escape strings', async () => {
		await equal('{{ "<html>" | escape | escape }}', {}, {
				autoescape: false
			},
			'&lt;html&gt;');
	});

	it('should not double escape with autoescape on', async () => {
		await equal('{% set val = "<html>" | escape %}{{ val }}', {}, {
				autoescape: true
			},
			'&lt;html&gt;');
	});

	it('should work with non-string values', async () => {
		await equal(
			'{{ foo | escape }}', {
				foo: ['<html>']
			}, {
				autoescape: false
			},
			'&lt;html&gt;');

		await equal(
			'{{ foo | escape }}', {
				foo: {
					toString: function() {
						return '<html>';
					}
				}
			}, {
				autoescape: false
			},
			'&lt;html&gt;');

		await equal('{{ foo | escape }}', {
				foo: null
			}, {
				autoescape: false
			},
			'');
	});

	it('should not escape safe strings with autoescape on', async () => {
		await equal(
			'{{ "<html>" | safe | escape }}', {}, {
				autoescape: true
			},
			'<html>');

		await equal(
			'{% set val = "<html>" | safe | e %}{{ val }}', {}, {
				autoescape: true
			},
			'<html>');
	});

	it('should keep strings escaped after they have been escaped', async () => {
		await equal(
			'{% set val = "<html>" | e | safe %}{{ val }}', {}, {
				autoescape: false
			},
			'&lt;html&gt;');
	});

	it('dictsort', async () => {
		// no real foolproof way to test that a js obj has been transformed
		// from unsorted -> sorted, as its enumeration ordering is undefined
		// and might fluke being sorted originally .. lets just init with some jumbled
		// keys

		// no params - should be case insensitive, by key
		await equal(
			'{% for item in items | dictsort %}' +
			'{{ item[0] }}{% endfor %}', {
				items: {
					e: 1,
					d: 2,
					c: 3,
					a: 4,
					f: 5,
					b: 6
				}
			},
			'abcdef');

		// case sensitive = true
		await equal(
			'{% for item in items | dictsort(true) %}{{ item[0] }},{% endfor %}', {
				items: {
					ABC: 6,
					ABc: 5,
					Abc: 1,
					abc: 2
				}
			},
			'ABC,ABc,Abc,abc,');

		// use values for sort
		await equal(
			'{% for item in items | dictsort(false, "value") %}{{ item[0] }}{% endfor %}', {
				items: {
					a: 6,
					b: 5,
					c: 1,
					d: 2
				}
			},
			'cdba');
	});

	it('first', async () => {
		await equal('{{ [1,2,3] | first }}', '1');
	});

	it('float', async () => {
		await equal('{{ "3.5" | float }}', '3.5');
		await equal('{{ "0" | float }}', '0');
	});

	it('forceescape', async () => {
		await equal('{{ str | forceescape }}', {
			str: r.markSafe('<html>')
		}, '&lt;html&gt;');
		await equal('{{ "<html>" | safe | forceescape }}', '&lt;html&gt;');
	});

	it('int', async () => {
		await equal('{{ "3.5" | int }}', '3');
		await equal('{{ "0" | int }}', '0');
		await equal('{{ "foobar" | int("42") }}', '42');
		await equal('{{ "0x4d32" | int(base=16) }}', '19762');
		await equal('{{ "011" | int(base=8) }}', '9');
	});

	it('int (default value)', async () => {
		await equal('{{ "bob" | int("cat") }}', 'cat');
	});

	it('float (default value)', async () => {
		await equal('{{ "bob" | float("cat") }}', 'cat');
	});

	it('groupby', async () => {
		const namesContext = {
			items: [{
					name: 'james',
					type: 'green'
				},
				{
					name: 'john',
					type: 'blue'
				},
				{
					name: 'jim',
					type: 'blue'
				},
				{
					name: 'jessie',
					type: 'green'
				}
			]
		};
		await equal(
			'{% for type, items in items | groupby("type") %}' +
			':{{ type }}:' +
			'{% for item in items %}' +
			'{{ item.name }}' +
			'{% endfor %}' +
			'{% endfor %}',
			namesContext,
			':green:jamesjessie:blue:johnjim');

		await equal(
			'{% for type, items in items | groupby("type") %}' +
			':{{ type }}:' +
			'{% for item in items %}' +
			'{{ item.name }}' +
			'{% endfor %}' +
			'{% endfor %}', {
				items: [{
						name: 'james',
						type: 'green'
					},
					{
						name: 'john',
						type: 'blue'
					},
					{
						name: 'jim',
						type: 'blue'
					},
					{
						name: 'jessie',
						color: 'green'
					}
				]
			},
			':green:james:blue:johnjim:undefined:jessie');

		await equal(
			'{% for year, posts in posts | groupby("date.year") %}' +
			':{{ year }}:' +
			'{% for post in posts %}' +
			'{{ post.title }}' +
			'{% endfor %}' +
			'{% endfor %}', {
				posts: [{
						date: {
							year: 2019
						},
						title: 'Post 1'
					},
					{
						date: {
							year: 2018
						},
						title: 'Post 2'
					},
					{
						date: {
							year: 2019
						},
						title: 'Post 3'
					}
				]
			},
			':2018:Post 2:2019:Post 1Post 3');

		await equal(
			'{% for year, posts in posts | groupby("date.year") %}' +
			':{{ year }}:' +
			'{% for post in posts %}' +
			'{{ post.title }}' +
			'{% endfor %}' +
			'{% endfor %}', {
				posts: [{
						date: {
							year: 2019
						},
						title: 'Post 1'
					},
					{
						date: {
							year: 2018
						},
						title: 'Post 2'
					},
					{
						meta: {
							month: 2
						},
						title: 'Post 3'
					}
				]
			},
			':2018:Post 2:2019:Post 1:undefined:Post 3');

		await equal(
			'{% for type, items in items | groupby({}) %}' +
			':{{ type }}:' +
			'{% for item in items %}' +
			'{{ item.name }}' +
			'{% endfor %}' +
			'{% endfor %}',
			namesContext,
			':undefined:jamesjohnjimjessie'
		);

		const undefinedTemplate = (
			'{% for type, items in items | groupby("a.b.c") %}' +
			':{{ type }}:' +
			'{% for item in items %}' +
			'{{ item.name }}' +
			'{% endfor %}' +
			'{% endfor %}'
		);
		await equal(
			undefinedTemplate,
			namesContext,
			':undefined:jamesjohnjimjessie'
		);

		const promise = render(undefinedTemplate,namesContext,{throwOnUndefined:true});
		await assert.rejects(promise,new TemplateError('groupby: attribute "a.b.c" resolved to undefined','undefined',0,0));

	});

	it('indent', async () => {
		await equal('{{ "one\ntwo\nthree" | indent }}',
			'one\n    two\n    three');
		await equal('{{ "one\ntwo\nthree" | indent(2) }}',
			'one\n  two\n  three');
		await equal('{{ "one\ntwo\nthree" | indent(2, true) }}',
			'  one\n  two\n  three');

		await equal('{{ str | indent }}', {
			str: r.markSafe('one\ntwo\nthree')
		}, 'one\n    two\n    three');

		await equal('{{ "" | indent }}', '');
		await equal('{{ undefined | indent }}', '');
		await equal('{{ undefined | indent(2) }}', '');
		await equal('{{ undefined | indent(2, true) }}', '');

		await equal('{{ null | indent }}', '');
		await equal('{{ null | indent(2) }}', '');
		await equal('{{ null | indent(2, true) }}', '');

		await equal('{{ nothing | indent }}', '');
		await equal('{{ nothing | indent(2) }}', '');
		await equal('{{ nothing | indent(2, true) }}', '');
	});

	it('join', async () => {
		await equal('{{ items | join }}', {
				items: [1, 2, 3]
			},
			'123');

		await equal('{{ items | join(",") }}', {
				items: ['foo', 'bar', 'bear']
			},
			'foo,bar,bear');

		await equal('{{ items | join(",", "name") }}', {
				items: [{
						name: 'foo'
					},
					{
						name: 'bar'
					},
					{
						name: 'bear'
					}
				]
			},
			'foo,bar,bear');
	});

	it('last', async () => {
		await equal('{{ [1,2,3] | last }}', '3');
	});

	describe('the length filter', function suite() {
		it('should return length of a list literal', async () => {
			await equal('{{ [1,2,3] | length }}', '3');
		});
		it('should output 0 for a missing context variable', async () => {
			await equal('{{ blah|length }}', '0');
		});
		it('should output string length for string variables', async () => {
			await equal('{{ str | length }}', {
				str: 'blah'
			}, '4');
		});
		it('should output string length for a SafeString variable', async () => {
			await equal('{{ str | length }}', {
				str: r.markSafe('<blah>')
			}, '6');
		});
		it('should output the correct length of a string created with new String()', async () => {
			await equal('{{ str | length }}', {
				str: new String('blah') // eslint-disable-line no-new-wrappers
			}, '4');
		});
		it('should output 0 for a literal "undefined"', async () => {
			await equal('{{ undefined | length }}', '0');
		});
		it('should output 0 for a literal "null"', async () => {
			await equal('{{ null | length }}', '0');
		});
		it('should output 0 for an Object with no properties', async () => {
			await equal('{{ obj | length }}', {
				obj: {}
			}, '0');
		});
		it('should output 1 for an Object with 1 property', async () => {
			await equal('{{ obj | length }}', {
				obj: {
					key: 'value'
				}
			}, '1');
		});
		it('should output the number of properties for a plain Object, not the value of its length property', async () => {
			await equal('{{ obj | length }}', {
				obj: {
					key: 'value',
					length: 5
				}
			}, '2');
		});
		it('should output the length of an array', async () => {
			await equal('{{ arr | length }}', {
				arr: [0, 1]
			}, '2');
		});
		it('should output the full length of a sparse array', async () => {
			await equal('{{ arr | length }}', {
				arr: [0, , 2] // eslint-disable-line
			}, '3');
		});
		it('should output the length of an array created with "new Array"', async () => {
			await equal('{{ arr | length }}', {
				arr: new Array(0, 1) // eslint-disable-line no-array-constructor
			}, '2');
		});
		it('should output the length of an array created with "new Array" with user-defined properties', async () => {
			var arr = new Array(0, 1); // eslint-disable-line no-array-constructor
			( < any > arr).key = 'value';
			await equal('{{ arr | length }}', {
				arr: arr
			}, '2');
		});
		it('should output the length of a Map', async () => {
			var map = new Map([
				['key1', 'value1'],
				['key2', 'value2']
			]);
			map.set('key3', 'value3');
			await equal('{{ map | length }}', {
				map: map
			}, '3');
		});
		it('should output the length of a Set', async () => {
			var set = new Set(['value1']);
			set.add('value2');
			await equal('{{ set | length }}', {
				set: set
			}, '2');
		});
	});

	it('list', async () => {
		var person = {
			name: 'Joe',
			age: 83
		};
		await equal('{% for i in "foobar" | list %}{{ i }},{% endfor %}',
			'f,o,o,b,a,r,');
		await equal('{% for pair in person | list %}{{ pair.key }}: {{ pair.value }} - {% endfor %}', {
			person: person
		}, 'name: Joe - age: 83 - ');
		await equal('{% for i in [1, 2] | list %}{{ i }}{% endfor %}', '12');
	});

	it('lower', async () => {
		await equal('{{ "fOObAr" | lower }}', 'foobar');
		await equal('{{ str | lower }}', {
			str: r.markSafe('fOObAr')
		}, 'foobar');
		await equal('{{ null | lower }}', '');
		await equal('{{ undefined | lower }}', '');
		await equal('{{ nothing | lower }}', '');
	});

	it('nl2br', async () => {
		await equal('{{ null | nl2br }}', '');
		await equal('{{ undefined | nl2br }}', '');
		await equal('{{ nothing | nl2br }}', '');
		await equal('{{ str | nl2br }}', {
			str: r.markSafe('foo\r\nbar')
		}, 'foo<br />\nbar');
		await equal('{{ str | nl2br }}', {
			str: r.markSafe('foo\nbar')
		}, 'foo<br />\nbar');
		await equal('{{ str | nl2br }}', {
			str: r.markSafe('foo\n\nbar')
		}, 'foo<br />\n<br />\nbar');
		await equal('{{ "foo\nbar" | nl2br }}', 'foo&lt;br /&gt;\nbar');
	});

	it('random', async () => {
		var i;
		for (i = 0; i < 100; i++) {
			render('{{ [1,2,3,4,5,6,7,8,9] | random }}', function(err, res) {
				var val = parseInt(res, 10);
				expect(val).to.be.within(1, 9);
			});
		}
	});

	it('reject', async () => {
		var context = {
			numbers: [0, 1, 2, 3, 4, 5]
		};

		await equal('{{ numbers | reject("odd") | join }}', context, '024');

		await equal('{{ numbers | reject("even") | join }}', context, '135');

		await equal('{{ numbers | reject("divisibleby", 3) | join }}', context, '1245');

		await equal('{{ numbers | reject() | join }}', context, '0');
	});

	it('rejectattr', async () => {
		var foods = [{tasty: true},{tasty: false},{tasty:true}];
		await equal('{{ foods | rejectattr("tasty") | length }}', {
			foods: foods
		}, '1');
	});

	it('select', async () => {
		var context = {
			numbers: [0, 1, 2, 3, 4, 5]
		};

		await equal('{{ numbers | select("odd") | join }}', context, '135');

		await equal('{{ numbers | select("even") | join }}', context, '024');

		await equal('{{ numbers | select("divisibleby", 3) | join }}', context, '03');

		await equal('{{ numbers | select() | join }}', context, '12345');
	});

	it('selectattr', async () => {
		var foods = [{
			tasty: true
		}, {
			tasty: false
		}, {
			tasty: true
		}];
		await equal('{{ foods | selectattr("tasty") | length }}', {
			foods: foods
		}, '2');
	});

	it('replace', async () => {
		await equal('{{ 123456 | replace("4", ".") }}', '123.56');
		await equal('{{ 123456 | replace("4", ".") }}', '123.56');
		await equal('{{ 12345.6 | replace("4", ".") }}', '123.5.6');
		await equal('{{ 12345.6 | replace(4, ".") }}', '123.5.6');
		await equal('{{ 12345.6 | replace("4", "7") }}', '12375.6');
		await equal('{{ 12345.6 | replace(4, 7) }}', '12375.6');
		await equal('{{ 123450.6 | replace(0, 7) }}', '123457.6');
		await equal('{{ "aaabbbccc" | replace("", ".") }}', '.a.a.a.b.b.b.c.c.c.');
		await equal('{{ "aaabbbccc" | replace(null, ".") }}', 'aaabbbccc');
		await equal('{{ "aaabbbccc" | replace(undefined, ".") }}', 'aaabbbccc');
		await equal('{{ "aaabbbccc" | replace({}, ".") }}', 'aaabbbccc');
		await equal('{{ "aaabbbccc" | replace(true, ".") }}', 'aaabbbccc');
		await equal('{{ "aaabbbccc" | replace(false, ".") }}', 'aaabbbccc');
		await equal('{{ "aaabbbccc" | replace(["wrong"], ".") }}', 'aaabbbccc');
		await equal('{{ "aaabbbccc" | replace("a", "x") }}', 'xxxbbbccc');
		await equal('{{ "aaabbbccc" | replace("a", "x", 2) }}', 'xxabbbccc');
		await equal('{{ "aaabbbbbccc" | replace("b", "y", 4) }}', 'aaayyyybccc');
		await equal('{{ "aaabbbbbccc" | replace("", "") }}', 'aaabbbbbccc');
		await equal('{{ "aaabbbbbccc" | replace("b", "") }}', 'aaaccc');
		await equal('{{ "aaabbbbbccc" | replace("b", "", 4) }}', 'aaabccc');
		await equal('{{ "aaabbbbbccc" | replace("ab", "y", 4) }}', 'aaybbbbccc');
		await equal('{{ "aaabbbbbccc" | replace("b", "y", 4) }}', 'aaayyyybccc');
		await equal('{{ "aaabbbbbccc" | replace("d", "y", 4) }}', 'aaabbbbbccc');
		await equal('{{ "aaabbcccbbb" | replace("b", "y", 4) }}', 'aaayycccyyb');


		// Bad initial inputs
		await equal('{{ undefined | replace("b", "y", 4) }}', '');
		await equal('{{ null | replace("b", "y", 4) }}', '');
		await equal('{{ {} | replace("b", "y", 4) }}', '[object Object]'); // End up with the object passed out of replace, then toString called on it
		await equal('{{ [] | replace("b", "y", 4) }}', '');
		await equal('{{ true | replace("rue", "afafasf", 4) }}', 'true');
		await equal('{{ false | replace("rue", "afafasf", 4) }}', 'false');

		// Will result in an infinite loop if unbounded otherwise test will pass
		await equal('{{ "<img src=" | replace("<img", "<img alt=val") | safe }}',
			'<img alt=val src=');
		await equal('{{ "<img src=\\"http://www.example.com\\" />" | replace("<img", "replacement text") | safe }}',
			'replacement text src=\"http://www.example.com\" />');

		// Regex
		await equal('{{ "aabbbb" | replace(r/ab{2}/, "z") }}', 'azbb');
		await equal('{{ "aaaAAA" | replace(r/a/i, "z") }}', 'zaaAAA');
		await equal('{{ "aaaAAA" | replace(r/a/g, "z") }}', 'zzzAAA');
		await equal('{{ "aaaAAA" | replace(r/a/gi, "z") }}', 'zzzzzz');
		await equal('{{ str | replace("a", "x") }}', {
			str: r.markSafe('aaabbbccc')
		}, 'xxxbbbccc');
	});

	it('reverse', async () => {
		await equal('{{ "abcdef" | reverse }}', 'fedcba');
		await equal('{% for i in [1, 2, 3, 4] | reverse %}{{ i }}{% endfor %}', '4321');
	});

	it('round', async () => {
		await equal('{{ 4.5 | round }}', '5');
		await equal('{{ 4.5 | round(0, "floor") }}', '4');
		await equal('{{ 4.12345 | round(4) }}', '4.1235');
		await equal('{{ 4.12344 | round(4) }}', ('4.1234'));
	});

	it('slice', async () => {
		var tmpl = '{% for items in arr | slice(3) %}' +
			'--' +
			'{% for item in items %}' +
			'{{ item }}' +
			'{% endfor %}' +
			'--' +
			'{% endfor %}';

		await equal(tmpl, {
				arr: [1, 2, 3, 4, 5, 6, 7, 8, 9]
			},
			'--123----456----789--');

		await equal(tmpl, {
				arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			},
			'--1234----567----8910--');
	});

	it('sum', async () => {
		await equal('{{ items | sum }}', {
				items: [1, 2, 3]
			},
			'6');

		await equal('{{ items | sum("value") }}', {
				items: [{
						value: 1
					},
					{
						value: 2
					},
					{
						value: 3
					}
				]
			},
			'6');

		await equal('{{ items | sum("value", 10) }}', {
				items: [{
						value: 1
					},
					{
						value: 2
					},
					{
						value: 3
					}
				]
			},
			'16');
	});

	it('sort', async () => {
		await equal('{% for i in [3,5,2,1,4,6] | sort %}{{ i }}{% endfor %}',
			'123456');

		await equal('{% for i in ["fOo", "Foo"] | sort %}{{ i }}{% endfor %}',
			'fOoFoo');

		await equal('{% for i in [1,6,3,7] | sort(true) %}{{ i }}{% endfor %}',
			'7631');

		await equal('{% for i in ["fOo", "Foo"] | sort(false, true) %}{{ i }}{% endfor %}',
			'FoofOo');

		await equal('{% for item in items | sort(false, false, "name") %}{{ item.name }}{% endfor %}', {
				items: [{
						name: 'james'
					},
					{
						name: 'fred'
					},
					{
						name: 'john'
					}
				]
			},
			'fredjamesjohn');

		await equal('{% for i in [ {n:3},{n:5},{n:2},{n:1},{n:4},{n:6}] | sort(attribute="n") %}{{ i.n }}{% endfor %}',
			'123456');

		const nestedAttributeSortTemplate = '{% for item in items | sort(attribute="meta.age") %}{{ item.name }}{% endfor %}';
		await equal(
			nestedAttributeSortTemplate, {
				items: [{
						name: 'james',
						meta: {
							age: 25
						}
					},
					{
						name: 'fred',
						meta: {
							age: 18
						}
					},
					{
						name: 'john',
						meta: {
							age: 19
						}
					}
				]
			},
			'fredjohnjames'
		);

		const promise = render(
			nestedAttributeSortTemplate, {
				items: [{
						name: 'james',
						meta: {
							age: 25
						}
					},
					{
						name: 'fred',
						meta: {
							age: 18
						}
					},
					{
						name: 'john',
						meta: {
							title: 'Developer'
						}
					}
				]
			}, {
				throwOnUndefined: true
			}
		);
		await assert.rejects(promise, new TemplateError('sort: attribute "meta\.age" resolved to undefined', 'undefined', 0, 0));
	});

	it('string', async () => {
		await equal('{% for i in 1234 | string | list %}{{ i }},{% endfor %}',
			'1,2,3,4,');
	});

	it('striptags', async () => {
		await equal('{{ html | striptags }}', {
			html: '<foo>bar'
		}, 'bar');
		await equal('{{ html | striptags }}', {
				html: '  <p>an  \n <a href="#">example</a> link</p>\n<p>to a webpage</p> ' +
					'<!-- <p>and some comments</p> -->'
			},
			'an example link to a webpage');
		await equal('{{ undefined | striptags }}', '');
		await equal('{{ null | striptags }}', '');
		await equal('{{ nothing | striptags }}', '');
		await equal('{{ html | striptags(true) }}', {
				html: '<div>\n  row1\nrow2  \n  <strong>row3</strong>\n</div>\n\n' +
					' HEADER \n\n<ul>\n  <li>option  1</li>\n<li>option  2</li>\n</ul>'
			},
			'row1\nrow2\nrow3\n\nHEADER\n\noption 1\noption 2');
	});

	it('title', async () => {
		await equal('{{ "foo bar baz" | title }}', 'Foo Bar Baz');
		await equal('{{ str | title }}', {
			str: r.markSafe('foo bar baz')
		}, 'Foo Bar Baz');
		await equal('{{ undefined | title }}', '');
		await equal('{{ null | title }}', '');
		await equal('{{ nothing | title }}', '');
	});

	it('trim', async () => {
		await equal('{{ "  foo " | trim }}', 'foo');
		await equal('{{ str | trim }}', {
			str: r.markSafe('  foo ')
		}, 'foo');
	});

	it('truncate', async () => {
		await equal('{{ "foo bar" | truncate(3) }}', 'foo...');
		await equal('{{ "foo bar baz" | truncate(6) }}', 'foo...');
		await equal('{{ "foo bar baz" | truncate(7) }}', 'foo bar...');
		await equal('{{ "foo bar baz" | truncate(5, true) }}', 'foo b...');
		await equal('{{ "foo bar baz" | truncate(6, true, "?") }}', 'foo ba?');
		await equal('{{ "foo bar" | truncate(3) }}', {
			str: r.markSafe('foo bar')
		}, 'foo...');

		await equal('{{ undefined | truncate(3) }}', '');
		await equal('{{ undefined | truncate(6) }}', '');
		await equal('{{ undefined | truncate(7) }}', '');
		await equal('{{ undefined | truncate(5, true) }}', '');
		await equal('{{ undefined | truncate(6, true, "?") }}', '');

		await equal('{{ null | truncate(3) }}', '');
		await equal('{{ null | truncate(6) }}', '');
		await equal('{{ null | truncate(7) }}', '');
		await equal('{{ null | truncate(5, true) }}', '');
		await equal('{{ null | truncate(6, true, "?") }}', '');

		await equal('{{ nothing | truncate(3) }}', '');
		await equal('{{ nothing | truncate(6) }}', '');
		await equal('{{ nothing | truncate(7) }}', '');
		await equal('{{ nothing | truncate(5, true) }}', '');
		await equal('{{ nothing | truncate(6, true, "?") }}', '');
	});

	it('upper', async () => {
		await equal('{{ "foo" | upper }}', 'FOO');
		await equal('{{ str | upper }}', {
			str: r.markSafe('foo')
		}, 'FOO');
		await equal('{{ null | upper }}', '');
		await equal('{{ undefined | upper }}', '');
		await equal('{{ nothing | upper }}', '');
	});

	it('urlencode', async () => {
		await equal('{{ "&" | urlencode }}', '%26');
		await equal('{{ arr | urlencode | safe }}', {
			arr: [
				[1, 2],
				['&1', '&2']
			]
		}, '1=2&%261=%262');
		await equal('{{ obj | urlencode | safe }}', {
			obj: {
				1: 2,
				'&1': '&2'
			}
		}, '1=2&%261=%262');
	});

	it('urlencode - object without prototype', async () => {
		var obj = Object.create(null);
		obj['1'] = 2;
		obj['&1'] = '&2';

		await equal('{{ obj | urlencode | safe }}', {
			obj: obj
		}, '1=2&%261=%262');
	});

	it('urlize', async () => {
		// from jinja test suite:
		// https://github.com/mitsuhiko/jinja2/blob/8db47916de0e888dd8664b2511e220ab5ecf5c15/jinja2/testsuite/filters.py#L236-L239
		await equal('{{ "foo http://www.example.com/ bar" | urlize | safe }}',
			'foo <a href="http://www.example.com/">' +
			'http://www.example.com/</a> bar');

		// additional tests
		await equal('{{ "" | urlize }}', '');
		await equal('{{ "foo" | urlize }}', 'foo');

		// http
		await equal('{{ "http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

		// https
		await equal('{{ "https://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="https://jinja.pocoo.org/docs/templates/">https://jinja.pocoo.org/docs/templates/</a>');

		// www without protocol
		await equal('{{ "www.pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="http://www.pocoo.org/docs/templates/">www.pocoo.org/docs/templates/</a>');

		// .org, .net, .com without protocol or www
		await equal('{{ "pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="http://pocoo.org/docs/templates/">pocoo.org/docs/templates/</a>');
		await equal('{{ "pocoo.net/docs/templates/" | urlize | safe }}',
			'<a href="http://pocoo.net/docs/templates/">pocoo.net/docs/templates/</a>');
		await equal('{{ "pocoo.com/docs/templates/" | urlize | safe }}',
			'<a href="http://pocoo.com/docs/templates/">pocoo.com/docs/templates/</a>');
		await equal('{{ "pocoo.com:80" | urlize | safe }}',
			'<a href="http://pocoo.com:80">pocoo.com:80</a>');
		await equal('{{ "pocoo.com" | urlize | safe }}',
			'<a href="http://pocoo.com">pocoo.com</a>');
		await equal('{{ "pocoo.commune" | urlize | safe }}',
			'pocoo.commune');

		// truncate the printed URL
		await equal('{{ "http://jinja.pocoo.org/docs/templates/" | urlize(12, true) | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/" rel="nofollow">http://jinja</a>');

		// punctuation on the beginning of line.
		await equal('{{ "(http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
		await equal('{{ "<http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
		await equal('{{ "&lt;http://jinja.pocoo.org/docs/templates/" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

		// punctuation on the end of line
		await equal('{{ "http://jinja.pocoo.org/docs/templates/," | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
		await equal('{{ "http://jinja.pocoo.org/docs/templates/." | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
		await equal('{{ "http://jinja.pocoo.org/docs/templates/)" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');
		await equal('{{ "http://jinja.pocoo.org/docs/templates/\n" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>\n');
		await equal('{{ "http://jinja.pocoo.org/docs/templates/&gt;" | urlize | safe }}',
			'<a href="http://jinja.pocoo.org/docs/templates/">http://jinja.pocoo.org/docs/templates/</a>');

		// http url with username
		await equal('{{ "http://testuser@testuser.com" | urlize | safe }}',
			'<a href="http://testuser@testuser.com">http://testuser@testuser.com</a>');

		// email addresses
		await equal('{{ "testuser@testuser.com" | urlize | safe }}',
			'<a href="mailto:testuser@testuser.com">testuser@testuser.com</a>');

		// periods in the text
		await equal('{{ "foo." | urlize }}', 'foo.');
		await equal('{{ "foo.foo" | urlize }}', 'foo.foo');

		// markup in the text
		await equal('{{ "<b>what up</b>" | urlize | safe }}', '<b>what up</b>');

		// breaklines and tabs in the text
		await equal('{{ "what\nup" | urlize | safe }}', 'what\nup');
		await equal('{{ "what\tup" | urlize | safe }}', 'what\tup');
	});

	it('wordcount', async () => {
		await equal('{{ "foo bar baz" | wordcount }}', '3');
		await equal(
			'{{ str | wordcount }}', {
				str: r.markSafe('foo bar baz')
			},
			'3');
		await equal('{{ null | wordcount }}', '');
		await equal('{{ undefined | wordcount }}', '');
		await equal('{{ nothing | wordcount }}', '');
	});
});
