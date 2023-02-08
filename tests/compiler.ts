import 'mocha';
import assert from 'assert';
import expect from 'expect.js';
import TemplateError from '../src/TemplateError';
import Template from '../src/template';
import Environment from '../src/environment';
import {FileSystemLoader as Loader} from '../src/node-loaders';
import {render,equal} from './util';
import {runLoopTests} from './compilerLoops';
import {testCompileMacros} from './compileMacros';
import {testFilterTag} from './compilerFilterTag';

describe('compiler',function() {
	mainCompilerTests1();
	testCompileMacros();
	mainCompilerTests2();
	runLoopTests();
	testFilterTag();
});

function mainCompilerTests1()
{
	it('should compile templates', async () => {
		await equal('Hello world', 'Hello world');
		await equal('Hello world, {{ name }}', {
				name: 'James'
			},
			'Hello world, James');

		await equal('Hello world, {{name}}{{suffix}}, how are you', {
				name: 'James',
				suffix: ' Long'
			},
			'Hello world, James Long, how are you');
	});

	it('should escape newlines', async () => {
		await equal('foo\\nbar', 'foo\\nbar');
	});

	it('should escape Unicode line seperators', async () => {
		await equal('\u2028', '\u2028');
	});

	it('should compile references', async () => {
		await equal('{{ foo.bar }}', {
				foo: {
					bar: 'baz'
				}
			},
			'baz');

		await equal('{{ foo["bar"] }}', {
				foo: {
					bar: 'baz'
				}
			},
			'baz');
	});

	it('should compile references - object without prototype', async () => {
		var context = Object.create(null);
		context.foo = Object.create(null);
		context.foo.bar = 'baz';

		await equal('{{ foo.bar }}',
			context,
			'baz');

		await equal('{{ foo["bar"] }}',
			context,
			'baz');
	});

	it('should fail silently on undefined values', async () => {
		await equal('{{ foo }}', '');
		await equal('{{ foo.bar }}', '');
		await equal('{{ foo.bar.baz }}', '');
		await equal('{{ foo.bar.baz["biz"].mumble }}', '');
	});

	it('should not treat falsy values the same as undefined', async () => {
		await equal('{{ foo }}', {foo:0}, '0');
		await equal('{{ foo }}', {foo:false}, 'false');
	});

	it('should display none as empty string', async () => {
		await equal('{{ none }}', '');
	});

	it('should compile none as falsy', async () => {
		await equal('{% if not none %}yes{% endif %}', 'yes');
	});

	it('should compile none as null, not undefined', async () => {
		await equal('{{ none|default("d", false) }}', '');
	});

	it('should compile function calls', async () => {
		await equal('{{ foo("msg") }}', {
				foo: function(str) { return str + 'hi'; }
			}, 'msghi');
	});

	it('should compile function calls with correct scope', async () => {
		await equal('{{ foo.bar() }}', {
			foo: {
				bar: function() { return this.baz; },
				baz: 'hello'
			}
		}, 'hello');
	});

	it('should compile switch statements', async () => {
		// standard switches
		const tpl1 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% default %}NEITHER FOO NOR BAR{% endswitch %}';
		// test no-default switches
		const tpl2 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% endswitch %}';
		// test fall-through cases
		var tpl3 = '{% switch foo %}{% case "bar" %}{% case "baz" %}BAR{% endswitch %}';
		await equal(tpl1, 'NEITHER FOO NOR BAR');
		await equal(tpl1, {foo:'bar'}, 'BAR');
		await equal(tpl1, {foo:'baz'}, 'BAZ');
		await equal(tpl2, '');
		await equal(tpl3, {foo:'bar'}, 'BAR');
		await equal(tpl3, {foo:'baz'}, 'BAR');
	});

	it('should compile if blocks', async () => {
		var tmpl = ('Give me some {% if hungry %}pizza{% else %}water{% endif %}');

		await equal(tmpl, {hungry: true}, 'Give me some pizza');
		await equal(tmpl, { hungry: false}, 'Give me some water');
		await equal('{% if not hungry %}good{% endif %}', {hungry: false}, 'good');

		await equal('{% if hungry and like_pizza %}good{% endif %}', {
				hungry: true,
				like_pizza: true
			},
			'good');

		await equal('{% if hungry or like_pizza %}good{% endif %}', {
				hungry: false,
				like_pizza: true
			},
			'good');

		await equal('{% if (hungry or like_pizza) and anchovies %}good{% endif %}', {
				hungry: false,
				like_pizza: true,
				anchovies: true
			},
			'good');

		await equal(
			'{% if food == "pizza" %}pizza{% endif %}' +
			'{% if food =="beer" %}beer{% endif %}', {food:'beer'},'beer');

		await equal('{% if "pizza" in food %}yum{% endif %}',{food:{pizza:true}},'yum');
		await equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}',{pizza:true},'yum');
		await equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}',{pizza:true},'yum');
		await equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}',{anchovies:true},'yuck');
		await equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}',{anchovies:true},'yuck');
		await equal(
			'{% if topping == "pepperoni" %}yum{% elseif topping == "anchovies" %}' +
			'yuck{% else %}hmmm{% endif %}', {
				topping: 'sausage'
			},
			'hmmm');
	});

	it('should compile the ternary operator', async () => {
		await equal('{{ "foo" if bar else "baz" }}', 'baz');
		await equal('{{ "foo" if bar else "baz" }}', {bar:true}, 'foo');
	});

	it('should compile inline conditionals', async () => {
		var tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

		await equal(tmpl, {hungry:true}, 'Give me some pizza');
		await equal(tmpl, {hungry: false},'Give me some water');
		await equal('{{ "good" if not hungry }}', {hungry: false}, 'good');
		await equal('{{ "good" if hungry and like_pizza }}', {hungry: true,like_pizza:true},'good');
		await equal('{{ "good" if hungry or like_pizza }}', {hungry: false,like_pizza:true},'good');
		await equal('{{ "good" if (hungry or like_pizza) and anchovies }}', {
			hungry: false,
			like_pizza: true,
			anchovies: true
		}, 'good');
		await equal(
			'{{ "pizza" if food == "pizza" }}' +
			'{{ "beer" if food == "beer" }}', {
				food: 'beer'
			}, 'beer');
	});


	it('should allow overriding var with none inside nested scope', async () => {
		await equal(
			'{% set var = "foo" %}' +
			'{% for i in [1] %}{% set var = none %}{{ var }}{% endfor %}',
			'');
	});

	it('should compile basic arithmetic operators', async () => {
		await equal('{{ 3 + 4 - 5 * 6 / 10 }}', '4');
	});

	it('should compile the exponentiation (**) operator', async () => {
		await equal('{{ 4**5 }}', '1024');
	});

	it('should compile the integer division (//) operator', async () => {
		await equal('{{ 9//5 }}', '1');
	});

	it('should compile the modulus operator', async () => {
		await equal('{{ 9%5 }}', '4');
	});

	it('should compile numeric negation operator', async () => {
		await equal('{{ -5 }}', '-5');
	});

	it('should compile comparison operators', async () => {
		await equal('{% if 3 < 4 %}yes{% endif %}', 'yes');
		await equal('{% if 3 > 4 %}yes{% endif %}', '');
		await equal('{% if 9 >= 10 %}yes{% endif %}', '');
		await equal('{% if 10 >= 10 %}yes{% endif %}', 'yes');
		await equal('{% if 9 <= 10 %}yes{% endif %}', 'yes');
		await equal('{% if 10 <= 10 %}yes{% endif %}', 'yes');
		await equal('{% if 11 <= 10 %}yes{% endif %}', '');

		await equal('{% if 10 != 10 %}yes{% endif %}', '');
		await equal('{% if 10 == 10 %}yes{% endif %}', 'yes');

		await equal('{% if "0" == 0 %}yes{% endif %}', 'yes');
		await equal('{% if "0" === 0 %}yes{% endif %}', '');
		await equal('{% if "0" !== 0 %}yes{% endif %}', 'yes');
		await equal('{% if 0 == false %}yes{% endif %}', 'yes');
		await equal('{% if 0 === false %}yes{% endif %}', '');

		await equal('{% if foo(20) > bar %}yes{% endif %}', {
				foo: function(n) {
					return n - 1;
				},
				bar: 15
			},
			'yes');
	});

	it('should compile python-style ternary operators', async () => {
		await equal('{{ "yes" if 1 is odd else "no"  }}', 'yes');
		await equal('{{ "yes" if 2 is even else "no"  }}', 'yes');
		await equal('{{ "yes" if 2 is odd else "no"  }}', 'no');
		await equal('{{ "yes" if 1 is even else "no"  }}', 'no');
	});

	it('should compile the "in" operator for Arrays', async () => {
		await equal('{% if 1 in [1, 2] %}yes{% endif %}', 'yes');
		await equal('{% if 1 in [2, 3] %}yes{% endif %}', '');
		await equal('{% if 1 not in [1, 2] %}yes{% endif %}', '');
		await equal('{% if 1 not in [2, 3] %}yes{% endif %}', 'yes');
		await equal('{% if "a" in vals %}yes{% endif %}', {
				vals: ['a', 'b']
			},
			'yes');
	});

	it('should compile the "in" operator for objects', async () => {
		await equal('{% if "a" in obj %}yes{% endif %}', {obj:{a:true}},'yes');
		await equal('{% if "a" in obj %}yes{% endif %}', {obj:{b:true}},'');
	});

	it('should compile the "in" operator for strings', async () => {
		await equal('{% if "foo" in "foobar" %}yes{% endif %}', 'yes');
	});

	it('should throw an error when using the "in" operator on unexpected types', async () => {
		const promise1 = render('{% if "a" in 1 %}yes{% endif %}',{});
		await assert.rejects(promise1,new TemplateError('Cannot use "in" operator to search for "a" in unexpected types.','undefined',0,0));

		const promise2 = render('{% if "a" in obj %}yes{% endif %}',{});
		await assert.rejects(promise2,new TemplateError('Cannot use "in" operator to search for "a" in unexpected types.','undefined',0,0));
	});

	it('should throw exceptions when missing import', async () => {
		var tmpl = new Template('{% from "doesnotexist" import foo %}',new Environment(),null);
		const promise = tmpl.render({});

/*
promise.catch(err => {
  console.log('ZZZZ1  typeof err:',typeof err);
  console.log('ZZZZ2:',err);
  console.log('ZZZZ3:',JSON.stringify(err));
});
*/

		await assert.rejects(promise,new TemplateError('template not found: doesnotexist','undefined',0,0));
	});

	it('should include error line in raised TemplateError', async () => {
		const tmplStr = 
			`{% set items = ["a", "b",, "c"] %}
			 {{ items | join(",") }}`;

		const env = new Environment(new Loader('tests/templates'));
		const tmpl = new Template(tmplStr,env,'parse-error.njk');

		const promise = tmpl.render({});
		await assert.rejects(promise,new TemplateError('unexpected token: ,','TODO',1,26));
	});

	it('should include error line when exception raised in user function', async () => {
		var tmplStr = `
			{% block content %}
				<div>{{ foo() }}</div>
			{% endblock %}`;
		var env = new Environment(new Loader('tests/templates'));
		var tmpl = new Template(tmplStr, env, 'user-error.njk');

		function foo() { throw new Error('CUSTOM ERROR'); }
		env.addGlobal('foo', foo);

		const promise = tmpl.render({});
//		await assert.rejects(promise,new TemplateError('CUSTOM ERROR','user-error.njk',0,0));
		await assert.rejects(promise,new TemplateError('CUSTOM ERROR','"user-error.njk"',0,0));
	});

	it('template attempts to include non-existent template', async () => {
		const promise = render('{% include "broken-import.njk" %}', {str:'abc'});
		await assert.rejects(promise,new TemplateError('template not found: doesnotexist','undefined',0,0));
	});

	it('should compile string concatenations with tilde', async () => {
		await equal('{{ 4 ~ \'hello\' }}', '4hello');
		await equal('{{ 4 ~ 5 }}', '45');
		await equal('{{ \'a\' ~ \'b\' ~ 5 }}', 'ab5');
	});
}

function mainCompilerTests2()
{
	it('should inherit templates', async () => {
		await equal('{% extends "base.njk" %}', 'FooBarBazFizzle');
		await equal('hola {% extends "base.njk" %} hizzle mumble', 'FooBarBazFizzle');

		await equal('{% extends "base.njk" %}{% block block1 %}BAR{% endblock %}',
			'FooBARBazFizzle');

		await equal(
			'{% extends "base.njk" %}' +
			'{% block block1 %}BAR{% endblock %}' +
			'{% block block2 %}BAZ{% endblock %}',
			'FooBARBAZFizzle');

		await equal('hola {% extends tmpl %} hizzle mumble', {
				tmpl: 'base.njk'
			},
			'FooBarBazFizzle');
	}); 

	it('should not call blocks not defined from template inheritance', async () => {
		var count = 0;
		await render(
			'{% extends "base.njk" %}' +
			'{% block notReal %}{{ foo() }}{% endblock %}', {
				foo: function() {
					count++;
				}
			},
			function() {
				expect(count).to.be(0);
			});
	});

	it('should conditionally inherit templates', async () => {
		await equal(
			'{% if false %}{% extends "base.njk" %}{% endif %}' +
			'{% block block1 %}BAR{% endblock %}',
			'BAR');

		await equal(
			'{% if true %}{% extends "base.njk" %}{% endif %}' +
			'{% block block1 %}BAR{% endblock %}',
			'FooBARBazFizzle');

		await equal(
			'{% if true %}' +
			'{% extends "base.njk" %}' +
			'{% else %}' +
			'{% extends "base2.njk" %}' +
			'{% endif %}' +
			'{% block block1 %}HELLO{% endblock %}',
			'FooHELLOBazFizzle');

		await equal(
			'{% if false %}' +
			'{% extends "base.njk" %}' +
			'{% else %}' +
			'{% extends "base2.njk" %}' +
			'{% endif %}' +
			'{% block item %}hello{{ item }}{% endblock %}',
			'hello1hello2');
	});

	it('should error if same block is defined multiple times', async () => {
		try {
			await render(
				'{% extends "simple-base.njk" %}' +
				'{% block test %}{% endblock %}' +
				'{% block test %}{% endblock %}'
			);
			expect(true).to.not.be.ok();
		} catch (err) {
			expect(err).to.be.a(TemplateError);
			expect(err).to.be('Error" Block "test" defined more than once.');
		}
	});

	it('should render nested blocks in child template', async () => {
		await equal(
			'{% extends "base.njk" %}' +
			'{% block block1 %}{% block nested %}BAR{% endblock %}{% endblock %}',
			'FooBARBazFizzle');
	});

	it('should render parent blocks with super()', async () => {
		await equal(
			'{% extends "base.njk" %}' +
			'{% block block1 %}{{ super() }}BAR{% endblock %}',
			'FooBarBARBazFizzle');

		// two levels of `super` should work
		await equal(
			'{% extends "base-inherit.njk" %}' +
			'{% block block1 %}*{{ super() }}*{% endblock %}',
			'Foo**Bar**BazFizzle');
	});

	it('should let super() see global vars from child template', async () => {
		await equal(
			'{% extends "base-show.njk" %}{% set var = "child" %}' +
			'{% block main %}{{ super() }}{% endblock %}',
			'child');
	});

	it('should not let super() see vars from child block', async () => {
		await equal(
			'{% extends "base-show.njk" %}' +
			'{% block main %}{% set var = "child" %}{{ super() }}{% endblock %}',
			'');
	});

	it('should let child templates access parent global scope', async () => {
		await equal(
			'{% extends "base-set.njk" %}' +
			'{% block main %}{{ var }}{% endblock %}',
			'parent');
	});

	it('should not let super() modify calling scope', async () => {
		await equal(
			'{% extends "base-set-inside-block.njk" %}' +
			'{% block main %}{{ super() }}{{ var }}{% endblock %}',
			'');
	});

	it('should not let child templates set vars in parent scope', async () => {
		await equal(
			'{% extends "base-set-and-show.njk" %}' +
			'{% block main %}{% set var = "child" %}{% endblock %}',
			'parent');
	});

	it('should render blocks in their own scope', async () => {
		await equal(
			'{% set var = "parent" %}' +
			'{% block main %}{% set var = "inner" %}{% endblock %}' +
			'{{ var }}',
			'parent');
	});

	it('should include templates', async () => {
		const result = await render('hello world {% include "include.njk" %}');
		assert(result == 'hello world FooInclude ');
	});

	it('should include 130 templates without call stack size exceed', async () => {
		await equal('{% include "includeMany.njk" %}',
			new Array(131).join('FooInclude \n'));
	});

	it('should include templates with context', async () => {
		await equal('hello world {% include "include.njk" %}', {
				name: 'james'
			},
			'hello world FooInclude james');
	});

	it('should include templates that can see including scope, but not write to it', async () => {
		await equal('{% set var = 1 %}{% include "include-set.njk" %}{{ var }}', '12\n1');
	});

	it('should include templates dynamically', async () => {
		await equal('hello world {% include tmpl %}', {
				name: 'thedude',
				tmpl: 'include.njk'
			},
			'hello world FooInclude thedude');
	});

	it('should include templates dynamically based on a set var', async () => {
		await equal('hello world {% set tmpl = "include.njk" %}{% include tmpl %}', 
			{ name: 'thedude' },
			'hello world FooInclude thedude');
	});

	it('should include templates dynamically based on an object attr', async () => {
		await equal('hello world {% include data.tmpl %}', {
				name: 'thedude',
				data: { tmpl: 'include.njk' }
			},
			'hello world FooInclude thedude');
	});

	it('should throw an error when including a file that does not exist', async () => {
		const promise = render('{% include "missing.njk" %}', {});
		await assert.rejects(promise,new TemplateError('template not found: missing.njk','undefined',0,0));
	});

	it('should fail silently on missing templates if requested', async () => {
		await equal('hello world {% include "missing.njk" ignore missing %}', 'hello world ');

		await equal('hello world {% include "missing.njk" ignore missing %}', 
			{ name: 'thedude' }, 'hello world ');
	});

	/**
	 * This test checks that this issue is resolved: http://stackoverflow.com/questions/21777058/loop-index-in-included-nunjucks-file
	 */
	it('should have access to "loop" inside an include', async () => {
		await equal('{% for item in [1,2,3] %}{% include "include-in-loop.njk" %}{% endfor %}',
			'1,0,true\n2,1,false\n3,2,false\n');

		await equal('{% for k,v in items %}{% include "include-in-loop.njk" %}{% endfor %}', {
				items: {
					a: 'A',
					b: 'B'
				}
			},
			'1,0,true\n2,1,false\n');
	});

	it('should maintain nested scopes', async () => {
		await equal(
			'{% for i in [1,2] %}' +
			'{% for i in [3,4] %}{{ i }}{% endfor %}' +
			'{{ i }}{% endfor %}',
			'341342');
	});

	it('should allow blocks in for loops', async () => {
		await equal(
			'{% extends "base2.njk" %}' +
			'{% block item %}hello{{ item }}{% endblock %}',
			'hello1hello2');
	});

	it('should make includes inherit scope', async () => {
		await equal(
			'{% for item in [1,2] %}' +
			'{% include "item.njk" %}' +
			'{% endfor %}',
			'showing 1showing 2');
	});

	it('should compile a set block', async () => {
		await equal('{% set username = "foo" %}{{ username }}', {
				username: 'james'
			},
			'foo');

		await equal('{% set x, y = "foo" %}{{ x }}{{ y }}','foofoo');

		await equal('{% set x = 1 + 2 %}{{ x }}','3');

		await equal('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',{foo:2},'2');

		await equal('{% include "set.njk" %}{{ foo }}',{foo:'bar'},'bar');

		await equal('{% set username = username + "pasta" %}{{ username }}', {
				username: 'basta'
			},
			'bastapasta');

		// `set` should only set within its current scope
		await equal(
			'{% for i in [1] %}{% set val=5 %}{% endfor %}' +
			'{{ val }}',
			'');

		await equal(
			'{% for i in [1,2,3] %}' +
			'{% if not val %}{% set val=5 %}{% endif %}' +
			'{% set val=val+1 %}{{ val }}' +
			'{% endfor %}' +
			'afterwards: {{ val }}',
			'678afterwards: ');

		// however, like Python, if a variable has been set in an
		// above scope, any other set should correctly resolve to
		// that frame
		await equal(
			'{% set val=1 %}' +
			'{% for i in [1] %}{% set val=5 %}{% endfor %}' +
			'{{ val }}',
			'5');

		await equal(
			'{% set val=5 %}' +
			'{% for i in [1,2,3] %}' +
			'{% set val=val+1 %}{{ val }}' +
			'{% endfor %}' +
			'afterwards: {{ val }}',
			'678afterwards: 8');
	});

	it('should compile set with frame references', async () => {
		await equal('{% set username = user.name %}{{ username }}', {user: {name: 'james'}},'james');
	});

	it('should compile set assignments of the same variable', async () => {
		await equal(
			'{% set x = "hello" %}' +
			'{% if false %}{% set x = "world" %}{% endif %}' +
			'{{ x }}',
			'hello');

		await equal(
			'{% set x = "blue" %}' +
			'{% if true %}{% set x = "green" %}{% endif %}' +
			'{{ x }}',
			'green');
	});

	it('should compile block-set', async () => {
		await equal(
			'{% set block_content %}{% endset %}' +
			'{{ block_content }}',
			''
		);

		/**
		 * Capture blocks inside macros were printing to the main buffer instead of
		 * the temporary one, see https://github.com/mozilla/nunjucks/issues/914.
		 **/
		await equal(
			'{%- macro foo(bar) -%}' +
			'{%- set test -%}foo{%- endset -%}' +
			'{{ bar }}{{ test }}' +
			'{%- endmacro -%}' +
			'{{ foo("bar") }}',
			'barfoo'
		);

		await equal(
			'{% set block_content %}test string{% endset %}' +
			'{{ block_content }}',
			'test string'
		);

		await equal(
			'{% set block_content %}' +
			'{% for item in [1, 2, 3] %}' +
			'{% include "item.njk" %} ' +
			'{% endfor %}' +
			'{% endset %}' +
			'{{ block_content }}',
			'showing 1 showing 2 showing 3 '
		);

		await equal(
			'{% set block_content %}' +
			'{% set inner_block_content %}' +
			'{% for i in [1, 2, 3] %}' +
			'item {{ i }} ' +
			'{% endfor %}' +
			'{% endset %}' +
			'{% for i in [1, 2, 3] %}' +
			'inner {{i}}: "{{ inner_block_content }}" ' +
			'{% endfor %}' +
			'{% endset %}' +
			'{{ block_content | safe }}',
			'inner 1: "item 1 item 2 item 3 " ' +
			'inner 2: "item 1 item 2 item 3 " ' +
			'inner 3: "item 1 item 2 item 3 " '
		);

		await equal(
			'{% set x,y,z %}' +
			'cool' +
			'{% endset %}' +
			'{{ x }} {{ y }} {{ z }}',
			'cool cool cool'
		);
	});

	it('should compile block-set wrapping an inherited block', async () => {
		await equal(
			'{% extends "base-set-wraps-block.njk" %}' +
			'{% block somevar %}foo{% endblock %}',
			'foo\n'
		);
	});

	it('should throw errors', async () => {
		const promise = render('{% from "import.njk" import boozle %}',{},null);
		await assert.rejects(promise,new TemplateError('cannot import boozle','undefined',0,0));
	});

	it('should allow custom tag compilation', async () => {
		function TestExtension() {
			this.tags = ['test'];

			this.parse = function(parser, nodes) {
				var content;
				var tag;
				parser.advanceAfterBlockEnd();

				content = parser.parseUntilBlocks('endtest');
				tag = new nodes.CallExtension(this, 'run', null, [content]);
				parser.advanceAfterBlockEnd();

				return tag;
			};

			this.run = function(context, content) {
				// Reverse the string
				return content().split('').reverse().join('');
			};
		}

		await equal('{% test %}123456789{% endtest %}', null, {
				extensions: {
					TestExtension: new TestExtension()
				}
			},
			'987654321');
	});

	it('should allow custom tag compilation without content', async () => {
		function TestExtension() {
			// jshint validthis: true
			this.tags = ['test'];

			this.parse = function(parser, nodes) {
				var tok = parser.nextToken();
				var args = parser.parseSignature(null, true);
				parser.advanceAfterBlockEnd(tok.value);

				return new nodes.CallExtension(this, 'run', args, null);
			};

			this.run = function(context, arg1) {
				// Reverse the string
				return arg1.split('').reverse().join('');
			};
		}

		await equal('{% test "123456" %}', null, {
				extensions: {
					TestExtension: new TestExtension()
				}
			},
			'654321');
	});

	it('should allow complicated custom tag compilation', async () => {
		function TestExtension() {
			// jshint validthis: true
			this.tags = ['test'];

			/* normally this is automatically done by Environment */
			this._name = TestExtension;

			this.parse = function(parser, nodes, lexer) {
				var body;
				var intermediate = null;

				parser.advanceAfterBlockEnd();

				body = parser.parseUntilBlocks('intermediate', 'endtest');

				if (parser.skipSymbol('intermediate')) {
					parser.skip(lexer.TOKEN_BLOCK_END);
					intermediate = parser.parseUntilBlocks('endtest');
				}

				parser.advanceAfterBlockEnd();

				return new nodes.CallExtension(this, 'run', null, [body, intermediate]);
			};

			this.run = function(context, body, intermediate) {
				var output = body().split('').join(',');
				if (intermediate) {
					// Reverse the string.
					output += intermediate().split('').reverse().join('');
				}
				return output;
			};
		}

		await equal('{% test %}abcdefg{% endtest %}', null, {
				extensions: {
					TestExtension: new TestExtension()
				}
			},
			'a,b,c,d,e,f,g');

		await equal('{% test %}abcdefg{% intermediate %}second half{% endtest %}',
			null, {
				extensions: {
					TestExtension: new TestExtension()
				}
			},
			'a,b,c,d,e,f,gflah dnoces');
	});

	it('should allow custom tag with args compilation', async () => {
		var opts;

		function TestExtension() {
			// jshint validthis: true
			this.tags = ['test'];

			/* normally this is automatically done by Environment */
			this._name = TestExtension;

			this.parse = function(parser, nodes) {
				var body;
				var args;
				var tok = parser.nextToken();

				// passing true makes it tolerate when no args exist
				args = parser.parseSignature(true);
				parser.advanceAfterBlockEnd(tok.value);

				body = parser.parseUntilBlocks('endtest');
				parser.advanceAfterBlockEnd();

				return new nodes.CallExtension(this, 'run', args, [body]);
			};

			this.run = function(context, prefix, kwargs, body) {
				var output;
				if (typeof prefix === 'function') {
					body = prefix;
					prefix = '';
					kwargs = {};
				} else if (typeof kwargs === 'function') {
					body = kwargs;
					kwargs = {};
				}

				output = prefix + body().split('').reverse().join('');
				if (kwargs.cutoff) 
					output = output.slice(0, kwargs.cutoff);

				return output;
			};
		}

		opts = {
			extensions: {
				TestExtension: new TestExtension()
			}
		};

		await equal(
			'{% test %}foobar{% endtest %}', null, opts,
			'raboof');

		await equal(
			'{% test("biz") %}foobar{% endtest %}', null, opts,
			'bizraboof');

		await equal(
			'{% test("biz", cutoff=5) %}foobar{% endtest %}', null, opts,
			'bizra');
	});

	it('should autoescape by default', async () => {
		await equal('{{ foo }}', {
			foo: '"\'<>&'
		}, '&quot;&#39;&lt;&gt;&amp;');
	});

	it('should autoescape if autoescape is on', async () => {
		await equal(
			'{{ foo }}', {
				foo: '"\'<>&'
			}, {
				autoescape: true
			},
			'&quot;&#39;&lt;&gt;&amp;');

		await equal('{{ foo|reverse }}',{foo:'"\'<>&'},{autoescape:true},'&amp;&gt;&lt;&#39;&quot;');

		await equal('{{ foo|reverse|safe }}',{foo:'"\'<>&'},{autoescape:true},'&><\'"');

		await equal('{{ foo }}',{foo:null},{autoescape:true},'');

		await equal('{{ foo }}',{foo:['<p>foo</p>']},{autoescape:true},'&lt;p&gt;foo&lt;/p&gt;');

		await equal(
			'{{ foo }}', {
				foo: { toString: function() { return '<p>foo</p>'; } }
			}, { autoescape: true },
			'&lt;p&gt;foo&lt;/p&gt;');

		await equal('{{ foo | safe }}', { foo: null }, { autoescape: true }, '');

		await equal('{{ foo | safe }}',{foo:'<p>foo</p>'},{autoescape:true},'<p>foo</p>');

		await equal('{{ foo | safe }}',{foo:['<p>foo</p>']},{autoescape:true},'<p>foo</p>');

		await equal(
			'{{ foo | safe }}', {
				foo: {
					toString: function() { return '<p>foo</p>'; }
				}
			}, { autoescape: true },
			'<p>foo</p>');
	});

	it('should not autoescape safe strings', async () => {
		await equal( '{{ foo|safe }}', { foo: '"\'<>&' }, { autoescape: true }, '"\'<>&');
	});

	it('should not autoescape macros', async () => {
		await render(
			'{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
			'{{ foo("<>&", "<>") }}',
			null, { autoescape: true },
			function(err, res) {
				expect(res).to.be('&lt;&gt;&amp; and &lt;&gt;');
			}
		);

		await render(
			'{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
			'{{ foo("<>&", "<>") }}',
			null, {
				autoescape: true
			},
			function(err, res) {
				expect(res).to.be('<>& and &lt;&gt;');
			}
		);
	});

	it('should not autoescape super()', async () => {
		await render(
			'{% extends "base3.njk" %}' +
			'{% block block1 %}{{ super() }}{% endblock %}',
			null, {
				autoescape: true
			},
			function(err, res) {
				expect(res).to.be('<b>Foo</b>');
			}
		);
	});

	it('should not autoescape when extension set false', async () => {
		function TestExtension() {
			// jshint validthis: true
			this.tags = ['test'];

			this.autoescape = false;

			this.parse = function(parser, nodes) {
				var tok = parser.nextToken();
				var args = parser.parseSignature(null, true);
				parser.advanceAfterBlockEnd(tok.value);
				return new nodes.CallExtension(this, 'run', args, null);
			};

			this.run = function() {
				// Reverse the string
				return '<b>Foo</b>';
			};
		}

		await render(
			'{% test "123456" %}',
			null, {
				extensions: {
					TestExtension: new TestExtension()
				},
				autoescape: true
			},
			function(err, res) {
				expect(res).to.be('<b>Foo</b>');
			}
		);
	});

	it('should pass context as this to filters', async () => {
		await render(
			'{{ foo | hallo }}', {
				foo: 1,
				bar: 2
			}, {
				filters: {
					hallo: function(foo) {
						return foo + this.lookup('bar');
					}
				}
			},
			function(err, res) {
				expect(res).to.be('3');
			}
		);
	});

	it('should render regexs', async () => {
		await equal('{{ r/name [0-9] \\// }}', '/name [0-9] \\//');

		await equal('{{ r/x/gi }}', '/x/gi');
	});

	it('should throw an error when {% call %} is passed an object that is not a function', async () => {
		const promise = render('{% call foo() %}{% endcall %}',{foo:'bar'});
		await assert.rejects(promise,new TemplateError('Unable to call `foo`, which is not a function','undefined',0,11));
	});

	it('should throw an error when including a file that calls an undefined macro', async () => {
		const promise = render('{% include "undefined-macro.njk" %}',{});
		await assert.rejects(promise,new TemplateError('Unable to call `undef`, which is undefined or falsey','undefined',0,0));
	});

	it('should throw an error when including a file that calls an undefined macro even inside {% if %} tag', async () => {
		const promise = render('{% if true %}{% include "undefined-macro.njk" %}{% endif %}',{});
		await assert.rejects(promise,new TemplateError('Unable to call `undef`, which is undefined or falsey','undefined',0,0));
	});

	it('should throw an error when including a file that imports macro that calls an undefined macro', async () => {
		const promise = render('{% include "import-macro-call-undefined-macro.njk" %}',{list:[1, 2, 3]});
		await assert.rejects(promise,new TemplateError('Unable to call `t["defined_macro"]`, which is undefined or falsey','undefined',0,0));
	});


	it('should control whitespaces correctly', async () => {
		await equal(
			'{% if true -%}{{"hello"}} {{"world"}}{% endif %}',
			'hello world');

		await equal(
			'{% if true -%}{% if true %} {{"hello"}} {{"world"}}' +
			'{% endif %}{% endif %}',
			' hello world');

		await equal(
			'{% if true -%}{# comment #} {{"hello"}}{% endif %}',
			' hello');
	});

	it('should control expression whitespaces correctly', async () => {
		await equal(
			'Well, {{- \' hello, \' -}} my friend',
			'Well, hello, my friend'
		);
		await equal(' {{ 2 + 2 }} ', ' 4 ');
		await equal(' {{-2 + 2 }} ', '4 ');
		await equal(' {{ -2 + 2 }} ', ' 0 ');
		await equal(' {{ 2 + 2 -}} ', ' 4');
	});

	it('should get right value when macro parameter conflict with global macro name', async () => {
		await render(
			'{# macro1 and macro2 definition #}' +
			'{% macro macro1() %}' +
			'{% endmacro %}' +
			'' +
			'{% macro macro2(macro1="default") %}' +
			'{{macro1}}' +
			'{% endmacro %}' +
			'' +
			'{# calling macro2 #}' +
			'{{macro2("this should be outputted") }}', {}, {},
			function(err, res) {
				expect(res.trim()).to.eql('this should be outputted');
			});
	});

	it('should get right value when macro include macro', async () => {
		await render(
			'{# macro1 and macro2 definition #}' +
			'{% macro macro1() %} foo' +
			'{% endmacro %}' +
			'' +
			'{% macro macro2(text="default") %}' +
			'{{macro1()}}' +
			'{% endmacro %}' +
			'' +
			'{# calling macro2 #}' +
			'{{macro2("this should not be outputted") }}', {}, {},
			function(err, res) {
				expect(res.trim()).to.eql('foo');
			});
	});

	it('should allow access to outer scope in call blocks', async () => {
		await render(
			'{% macro inside() %}' +
			'{{ caller() }}' +
			'{% endmacro %}' +
			'{% macro outside(var) %}' +
			'{{ var }}\n' +
			'{% call inside() %}' +
			'{{ var }}' +
			'{% endcall %}' +
			'{% endmacro %}' +
			'{{ outside("foobar") }}', {}, {},
			function(err, res) {
				expect(res.trim()).to.eql('foobar\nfoobar');
			});
	});

	it('should not leak scope from call blocks to parent', async () => {
		await render(
			'{% set var = "expected" %}' +
			'{% macro inside() %}' +
			'{% set var = "incorrect-value" %}' +
			'{{ caller() }}' +
			'{% endmacro %}' +
			'{% macro outside() %}' +
			'{% call inside() %}' +
			'{% endcall %}' +
			'{% endmacro %}' +
			'{{ outside() }}' +
			'{{ var }}', {}, {},
			function(err, res) {
				expect(res.trim()).to.eql('expected');
			});
	});

	it('should import template objects', async () => {
		var tmpl = new Template('{% macro foo() %}Inside a macro{% endmacro %}{% set bar = "BAZ" %}',
			new Environment(),null);

		await equal(
			'{% import tmpl as imp %}' +
			'{{ imp.foo() }} {{ imp.bar }}', {
				tmpl: tmpl
			},
			'Inside a macro BAZ');

		await equal(
			'{% from tmpl import foo as baz, bar %}' +
			'{{ bar }} {{ baz() }}', {
				tmpl: tmpl
			},
			'BAZ Inside a macro');
	});

	it('should inherit template objects', async () => {
		var tmpl = new Template('Foo{% block block1 %}Bar{% endblock %}{% block block2 %}Baz{% endblock %}Whizzle',
			new Environment(),null);

		await equal('hola {% extends tmpl %} fizzle mumble', {
				tmpl: tmpl
			},
			'FooBarBazWhizzle');

		await equal(
			'{% extends tmpl %}' +
			'{% block block1 %}BAR{% endblock %}' +
			'{% block block2 %}BAZ{% endblock %}', {
				tmpl: tmpl
			},
			'FooBARBAZWhizzle');
	});

	it('should include template objects', async () => {
		var tmpl = new Template('FooInclude {{ name }}',new Environment(),null);

		await equal('hello world {% include tmpl %}', {
				name: 'thedude',
				tmpl: tmpl
			},
			'hello world FooInclude thedude');
	});

	it('should throw an error when invalid expression whitespaces are used', async () => {
		const promise = render(' {{ 2 + 2- }}',{});
		await assert.rejects(promise,new TemplateError('unexpected token: }}','TODO',1,12));
	});
}		

