(function() {
  'use strict';

  var expect;
  var util;
  var Template;
  var Loader;
  var Environment;
  var fs;
  var render;
  var equal;
  var isSlim;

  if (typeof require !== 'undefined') {
    expect = require('expect.js');
    util = require('./util');
    Template = require('../src/template').default;
    Environment = require('../src/environment').default;
    fs = require('fs');
  } else {
    expect = window.expect;
    util = window.util;
    Template = nunjucks.Template;
    Environment = nunjucks.Environment;
  }

  render = util.render;
  equal = util.equal;
  isSlim = util.isSlim;
//  Loader = util.Loader;
   Loader = require('../src/node-loaders').FileSystemLoader;

  describe('compiler', function() {
    it('should compile templates', async () => {
      await equal('Hello world', 'Hello world');
      await equal('Hello world, {{ name }}',
        {
          name: 'James'
        },
        'Hello world, James');

      await equal('Hello world, {{name}}{{suffix}}, how are you',
        {
          name: 'James',
          suffix: ' Long'
        },
        'Hello world, James Long, how are you');
    });

    it('should escape newlines', async() => {
      await equal('foo\\nbar', 'foo\\nbar');
    });

    it('should escape Unicode line seperators', async() => {
      await equal('\u2028', '\u2028');
    });

    it('should compile references', async() => {
      await equal('{{ foo.bar }}',
        {
          foo: {
            bar: 'baz'
          }
        },
        'baz');

      await equal('{{ foo["bar"] }}',
        {
          foo: {
            bar: 'baz'
          }
        },
        'baz');
    });

    it('should compile references - object without prototype', async() => {
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

    it('should fail silently on undefined values', async() => {
      await equal('{{ foo }}', '');
      await equal('{{ foo.bar }}', '');
      await equal('{{ foo.bar.baz }}', '');
      await equal('{{ foo.bar.baz["biz"].mumble }}', '');
    });

    it('should not treat falsy values the same as undefined', async() => {
      await equal('{{ foo }}', {
        foo: 0
      }, '0');
      await equal('{{ foo }}', {
        foo: false
      }, 'false');
    });

    it('should display none as empty string', async() => {
      await equal('{{ none }}', '');
    });

    it('should compile none as falsy', async() => {
      await equal('{% if not none %}yes{% endif %}', 'yes');
    });

    it('should compile none as null, not undefined', async() => {
      await equal('{{ none|default("d", false) }}', '');
    });

    it('should compile function calls', async() => {
      await equal('{{ foo("msg") }}',
        {
          foo: function(str) {
            return str + 'hi';
          }
        },
        'msghi');
    });

    it('should compile function calls with correct scope', async() => {
      await equal('{{ foo.bar() }}', {
        foo: {
          bar: function() {
            return this.baz;
          },
          baz: 'hello'
        }
      }, 'hello');
    });

    it('should compile switch statements', async() => {
      // standard switches
      var tpl1 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% default %}NEITHER FOO NOR BAR{% endswitch %}';
      // test no-default switches
      var tpl2 = '{% switch foo %}{% case "bar" %}BAR{% case "baz" %}BAZ{% endswitch %}';
      // test fall-through cases
      var tpl3 = '{% switch foo %}{% case "bar" %}{% case "baz" %}BAR{% endswitch %}';
      await equal(tpl1, 'NEITHER FOO NOR BAR');
      await equal(tpl1, {foo:'bar'}, 'BAR');
      await equal(tpl1, {foo:'baz'}, 'BAZ');
      await equal(tpl2, '');
      await equal(tpl3, {foo:'bar'}, 'BAR');
      await equal(tpl3, {foo:'baz'}, 'BAR');
    });

    it('should compile if blocks', async() => {
      var tmpl = ('Give me some {% if hungry %}pizza' +
        '{% else %}water{% endif %}');

      await equal(tmpl, {
        hungry: true
      }, 'Give me some pizza');
      await equal(tmpl, {
        hungry: false
      }, 'Give me some water');
      await equal('{% if not hungry %}good{% endif %}',
        {
          hungry: false
        },
        'good');

      await equal('{% if hungry and like_pizza %}good{% endif %}',
        {
          hungry: true,
          like_pizza: true
        },
        'good');

      await equal('{% if hungry or like_pizza %}good{% endif %}',
        {
          hungry: false,
          like_pizza: true
        },
        'good');

      await equal('{% if (hungry or like_pizza) and anchovies %}good{% endif %}',
        {
          hungry: false,
          like_pizza: true,
          anchovies: true
        },
        'good');

      await equal(
        '{% if food == "pizza" %}pizza{% endif %}' +
        '{% if food =="beer" %}beer{% endif %}',
        {
          food: 'beer'
        },
        'beer');

      await equal('{% if "pizza" in food %}yum{% endif %}',
        {
          food: {
            pizza: true
          }
        },
        'yum');

      await equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}',
        {
          pizza: true
        },
        'yum');

      await equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}',
        {
          pizza: true
        },
        'yum');

      await equal('{% if pizza %}yum{% elif anchovies %}yuck{% endif %}',
        {
          anchovies: true
        },
        'yuck');

      await equal('{% if pizza %}yum{% elseif anchovies %}yuck{% endif %}',
        {
          anchovies: true
        },
        'yuck');

      await equal(
        '{% if topping == "pepperoni" %}yum{% elseif topping == "anchovies" %}' +
        'yuck{% else %}hmmm{% endif %}',
        {
          topping: 'sausage'
        },
        'hmmm');
    });

    it('should compile the ternary operator', async() => {
      await equal('{{ "foo" if bar else "baz" }}', 'baz');
      await equal('{{ "foo" if bar else "baz" }}', {
        bar: true
      }, 'foo');
    });

    it('should compile inline conditionals', async() => {
      var tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

      await equal(tmpl, {
        hungry: true
      }, 'Give me some pizza');
      await equal(tmpl, {
        hungry: false
      }, 'Give me some water');
      await equal('{{ "good" if not hungry }}',
        {
          hungry: false
        }, 'good');
      await equal('{{ "good" if hungry and like_pizza }}',
        {
          hungry: true,
          like_pizza: true
        }, 'good');
      await equal('{{ "good" if hungry or like_pizza }}',
        {
          hungry: false,
          like_pizza: true
        }, 'good');
      await equal('{{ "good" if (hungry or like_pizza) and anchovies }}',
        {
          hungry: false,
          like_pizza: true,
          anchovies: true
        }, 'good');
      await equal(
        '{{ "pizza" if food == "pizza" }}' +
        '{{ "beer" if food == "beer" }}',
        {
          food: 'beer'
        }, 'beer');
    });

    function runLoopTests(block) {
      var end = {
//        asyncAll: 'endall',
//        asyncEach: 'endeach',
        for: 'endfor'
      }[block];

      describe('the ' + block + ' tag', function() {
        it('should loop over simple arrays', async() => {
          await equal(
            '{% ' + block + ' i in arr %}{{ i }}{% ' + end + ' %}',
            { arr: [1, 2, 3, 4, 5] },
            '12345');
        });
        it('should loop normally with an {% else %} tag and non-empty array', async() => {
          await equal(
            '{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
            { arr: [1, 2, 3, 4, 5] },
            '12345');
        });
        it('should execute the {% else %} block when looping over an empty array', async() => {
          await equal(
            '{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
            { arr: [] },
            'empty');
        });
        it('should support destructured looping', async() => {
          await equal(
            '{% ' + block + ' a, b, c in arr %}' +
            '{{ a }},{{ b }},{{ c }}.{% ' + end + ' %}',
            { arr: [['x', 'y', 'z'], ['1', '2', '3']] },
            'x,y,z.1,2,3.');
        });
        it('should do loop over key-values of a literal in-template Object', async() => {
          await equal(
            '{% ' + block + ' k, v in { one: 1, two: 2 } %}' +
            '-{{ k }}:{{ v }}-{% ' + end + ' %}', '-one:1--two:2-');
        });
        it('should support loop.index', async() => {
          await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index }}{% ' + end + ' %}', '123');
        });
        it('should support loop.index0', async() => {
          await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index0 }}{% ' + end + ' %}', '012');
        });
        it('should support loop.revindex', async() => {
          await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex }}{% ' + end + ' %}', '321');
        });
        it('should support loop.revindex0', async() => {
          await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex0 }}{% ' + end + ' %}', '210');
        });
        it('should support loop.first', async() => {
          await equal(
            '{% ' + block + ' i in [7,3,6] %}' +
            '{% if loop.first %}{{ i }}{% endif %}' +
            '{% ' + end + ' %}',
            '7');
        });
        it('should support loop.last', async() => {
          await equal(
            '{% ' + block + ' i in [7,3,6] %}' +
            '{% if loop.last %}{{ i }}{% endif %}' +
            '{% ' + end + ' %}',
            '6');
        });
        it('should support loop.length', async() => {
          await equal('{% ' + block + ' i in [7,3,6] %}{{ loop.length }}{% ' + end + ' %}', '333');
        });
        it('should fail silently when looping over an undefined variable', async() => {
          await equal('{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}', '');
        });
        it('should fail silently when looping over an undefined property', async() => {
          await equal(
            '{% ' + block + ' i in foo.bar %}{{ i }}{% ' + end + ' %}',
            { foo: {} },
            '');
        });
        // TODO: this behavior differs from jinja2
        it('should fail silently when looping over a null variable', async() => {
          await equal(
            '{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}',
            { foo: null },
            '');
        });
        it('should loop over two-dimensional arrays', async() => {
          await equal('{% ' + block + ' x, y in points %}[{{ x }},{{ y }}]{% ' + end + ' %}',
            { points: [[1, 2], [3, 4], [5, 6]] },
            '[1,2][3,4][5,6]');
        });
        it('should loop over four-dimensional arrays', async() => {
          await equal(
            '{% ' + block + ' a, b, c, d in arr %}[{{ a }},{{ b }},{{ c }},{{ d }}]{% ' + end + '%}',
            { arr: [[1, 2, 3, 4], [5, 6, 7, 8]] },
            '[1,2,3,4][5,6,7,8]');
        });
        it('should support loop.index with two-dimensional loops', async() => {
          await equal('{% ' + block + ' x, y in points %}{{ loop.index }}{% ' + end + ' %}',
            {
              points: [[1, 2], [3, 4], [5, 6]]
            },
            '123');
        });
        it('should support loop.revindex with two-dimensional loops', async() => {
          await equal('{% ' + block + ' x, y in points %}{{ loop.revindex }}{% ' + end + ' %}',
            {
              points: [[1, 2], [3, 4], [5, 6]]
            },
            '321');
        });
        it('should support key-value looping over an Object variable', async() => {
          await equal('{% ' + block + ' k, v in items %}({{ k }},{{ v }}){% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '(foo,1)(bar,2)');
        });
        it('should support loop.index when looping over an Object\'s key-value pairs', async() => {
          await equal('{% ' + block + ' k, v in items %}{{ loop.index }}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '12');
        });
        it('should support loop.revindex when looping over an Object\'s key-value pairs', async() => {
          await equal('{% ' + block + ' k, v in items %}{{ loop.revindex }}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '21');
        });
        it('should support loop.length when looping over an Object\'s key-value pairs', async() => {
          await equal('{% ' + block + ' k, v in items %}{{ loop.length }}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            '22');
        });
        it('should support include tags in the body of the loop', async() => {
          await equal('{% ' + block + ' item, v in items %}{% include "item.njk" %}{% ' + end + ' %}',
            {
              items: {
                foo: 1,
                bar: 2
              }
            },
            'showing fooshowing bar');
        });
        it('should work with {% set %} and {% include %} tags', async() => {
          await equal(
            '{% set item = passed_var %}' +
            '{% include "item.njk" %}\n' +
            '{% ' + block + ' i in passed_iter %}' +
            '{% set item = i %}' +
            '{% include "item.njk" %}\n' +
            '{% ' + end + ' %}',
            {
              passed_var: 'test',
              passed_iter: ['1', '2', '3']
            },
            'showing test\nshowing 1\nshowing 2\nshowing 3\n');
        });
        /* global Set */
        it('should work with Set builtin', async() => {
          if (typeof Set === 'undefined') {
            this.skip();
          } else {
            await equal('{% ' + block + ' i in set %}{{ i }}{% ' + end + ' %}',
              { set: new Set([1, 2, 3, 4, 5]) },
              '12345');

            await equal('{% ' + block + ' i in set %}{{ i }}{% else %}empty{% ' + end + ' %}',
              { set: new Set([1, 2, 3, 4, 5]) },
              '12345');

            await equal('{% ' + block + ' i in set %}{{ i }}{% else %}empty{% ' + end + ' %}',
              { set: new Set() },
              'empty');
          }
        });
        /* global Map */
        it('should work with Map builtin', async() => {
          if (typeof Map === 'undefined') {
            this.skip();
          } else {
            await equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% ' + end + ' %}',
              { map: new Map([[1, 2], [3, 4], [5, 6]]) },
              '[1,2][3,4][5,6]');

            await equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% ' + end + ' %}',
              { map: new Map([[1, 2], [3, 4], [5, 6]]) },
              '[1,2][3,4][5,6]');

            await equal('{% ' + block + ' k, v in map %}[{{ k }},{{ v }}]{% else %}empty{% ' + end + ' %}',
              { map: new Map() },
              'empty');
          }
        });
      });
    }

    runLoopTests('for');

    it('should allow overriding var with none inside nested scope', async() => {
      await equal(
        '{% set var = "foo" %}' +
        '{% for i in [1] %}{% set var = none %}{{ var }}{% endfor %}',
        '');
    });

    it('should compile basic arithmetic operators', async() => {
      await equal('{{ 3 + 4 - 5 * 6 / 10 }}', '4');
    });

    it('should compile the exponentiation (**) operator', async() => {
      await equal('{{ 4**5 }}', '1024');
    });

    it('should compile the integer division (//) operator', async() => {
      await equal('{{ 9//5 }}', '1');
    });

    it('should compile the modulus operator', async() => {
      await equal('{{ 9%5 }}', '4');
    });

    it('should compile numeric negation operator', async() => {
      await equal('{{ -5 }}', '-5');
    });

    it('should compile comparison operators', async() => {
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

      await equal('{% if foo(20) > bar %}yes{% endif %}',
        {
          foo: function(n) {
            return n - 1;
          },
          bar: 15
        },
        'yes');
    });

    it('should compile python-style ternary operators', async() => {
      await equal('{{ "yes" if 1 is odd else "no"  }}', 'yes');
      await equal('{{ "yes" if 2 is even else "no"  }}', 'yes');
      await equal('{{ "yes" if 2 is odd else "no"  }}', 'no');
      await equal('{{ "yes" if 1 is even else "no"  }}', 'no');
    });

    it('should compile the "in" operator for Arrays', async() => {
      await equal('{% if 1 in [1, 2] %}yes{% endif %}', 'yes');
      await equal('{% if 1 in [2, 3] %}yes{% endif %}', '');
      await equal('{% if 1 not in [1, 2] %}yes{% endif %}', '');
      await equal('{% if 1 not in [2, 3] %}yes{% endif %}', 'yes');
      await equal('{% if "a" in vals %}yes{% endif %}',
        { vals: ['a', 'b'] },
        'yes');
    });

    it('should compile the "in" operator for objects', async() => {
      await equal('{% if "a" in obj %}yes{% endif %}',
        { obj: { a: true } },
        'yes');
      await equal('{% if "a" in obj %}yes{% endif %}',
        { obj: { b: true } },
        '');
    });

    it('should compile the "in" operator for strings', async() => {
      await equal('{% if "foo" in "foobar" %}yes{% endif %}', 'yes');
    });

    it('should throw an error when using the "in" operator on unexpected types', async() => {
      await render(
        '{% if "a" in 1 %}yes{% endif %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(
            /Cannot use "in" operator to search for "a" in unexpected types\./
          );
        }
      );

      await render(
        '{% if "a" in obj %}yes{% endif %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(
            /Cannot use "in" operator to search for "a" in unexpected types\./
          );
        }
      );
    });

    if (!isSlim) {
      it('should throw exceptions when called synchronously', async() => {
        var tmpl = new Template('{% from "doesnotexist" import foo %}');
        async function templateRender() {
          await tmpl.render();
        }
        expect(templateRender).to.throwException(/template not found: doesnotexist/);
      });

      it('should include error line in raised TemplateError', async() => {
        var tmplStr = [
          '{% set items = ["a", "b",, "c"] %}',
          '{{ items | join(",") }}',
        ].join('\n');

        var loader = new Loader('tests/templates');
        var env = new Environment(loader);
        var tmpl = new Template(tmplStr, env, 'parse-error.njk');

        await tmpl.render({}, function(err, res) {
          expect(res).to.be(undefined);
          expect(err.toString()).to.be([
            'Template render error: (parse-error.njk) [Line 1, Column 26]',
            '  unexpected token: ,',
          ].join('\n'));
        });
      });

      it('should include error line when exception raised in user function', async() => {
        var tmplStr = [
          '{% block content %}',
          '<div>{{ foo() }}</div>',
          '{% endblock %}',
        ].join('\n');
        var env = new Environment(new Loader('tests/templates'));
        var tmpl = new Template(tmplStr, env, 'user-error.njk');

        function foo() {
          throw new Error('ERROR');
        }

        await tmpl.render({foo: foo}, function(err, res) {
          expect(res).to.be(undefined);
          expect(err.toString()).to.be([
            'Template render error: (user-error.njk) [Line 1, Column 11]',
            '  Error: ERROR',
          ].join('\n'));
          done();
        });
      });
    }

    it('should throw exceptions from included templates when called synchronously', async() => {
      async function templateRender() {
        await render('{% include "broken-import.njk" %}', {str: 'abc'});
      }
      expect(templateRender).to.throwException(/template not found: doesnotexist/);
    });

    it('should pass errors from included templates to callback when async', async() => {
      await render(
        '{% include "broken-import.njk" %}',
        {str: 'abc'},
        {noThrow: true},
        function(err, res) {
          expect(err).to.match(/template not found: doesnotexist/);
          expect(res).to.be(undefined);
          done();
        });
    });

    it('should compile string concatenations with tilde', async() => {
      await equal('{{ 4 ~ \'hello\' }}', '4hello');
      await equal('{{ 4 ~ 5 }}', '45');
      await equal('{{ \'a\' ~ \'b\' ~ 5 }}', 'ab5');
    });

    it('should compile macros', async() => {
      await equal(
        '{% macro foo() %}This is a macro{% endmacro %}' +
        '{{ foo() }}',
        'This is a macro');
    });

    it('should compile macros with optional args', async() => {
      await equal(
        '{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
        '{{ foo(1) }}',
        '');
    });

    it('should compile macros with args that can be passed to filters', async() => {
      await equal(
        '{% macro foo(x) %}{{ x|title }}{% endmacro %}' +
        '{{ foo("foo") }}',
        'Foo');
    });

    it('should compile macros with positional args', async() => {
      await equal(
        '{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
        '{{ foo(1, 2) }}',
        '2');
    });

    it('should compile macros with arg defaults', async() => {
      await equal(
        '{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
        '{{ foo(1, 2) }}',
        '2');
      await equal(
        '{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
        '{{ foo(1, 2) }}',
        '5');
    });

    it('should compile macros with keyword args', async() => {
      await equal(
        '{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
        '{{ foo(1, y=2) }}',
        '2');
    });

    it('should compile macros with only keyword args', async() => {
      await equal(
        '{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(x=1, y=2) }}',
        '125');
    });

    it('should compile macros with keyword args overriding defaults', async() => {
      await equal(
        '{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(x=1, y=2, z=3) }}',
        '123');
    });

    it('should compile macros with out-of-order keyword args', async() => {
      await equal(
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(1, z=3) }}',
        '123');
    });

    it('should compile macros', async() => {
      await equal(
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(1) }}',
        '125');
    });

    it('should compile macros with multiple overridden arg defaults', async() => {
      await equal(
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{{ foo(1, 10, 20) }}',
        '11020');
    });

    it('should compile macro calls inside blocks', async() => {
      await equal(
        '{% extends "base.njk" %}' +
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{% block block1 %}' +
        '{{ foo(1) }}' +
        '{% endblock %}',
        'Foo125BazFizzle');
    });

    it('should compile macros defined in one block and called in another', async() => {
      await equal(
        '{% block bar %}' +
        '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
        '{% endmacro %}' +
        '{% endblock %}' +
        '{% block baz %}' +
        '{{ foo(1) }}' +
        '{% endblock %}',
        '125');
    });

    it('should compile macros that include other templates', async() => {
      await equal(
        '{% macro foo() %}{% include "include.njk" %}{% endmacro %}' +
        '{{ foo() }}',
        {
          name: 'james'
        },
        'FooInclude james');
    });

    it('should compile macros that set vars', async() => {
      await equal(
        '{% macro foo() %}{% set x = "foo"%}{{ x }}{% endmacro %}' +
        '{% set x = "bar" %}' +
        '{{ x }}' +
        '{{ foo() }}' +
        '{{ x }}',
        'barfoobar');
    });

    it('should not leak variables set in macro to calling scope', async() => {
      await equal(
        '{% macro setFoo() %}' +
        '{% set x = "foo" %}' +
        '{{ x }}' +
        '{% endmacro %}' +
        '{% macro display() %}' +
        '{% set x = "bar" %}' +
        '{{ setFoo() }}' +
        '{{ x }}' +
        '{% endmacro %}' +
        '{{ display() }}',
        'foobar');
    });

    it('should not leak variables set in nested scope within macro out to calling scope', async() => {
      await equal(
        '{% macro setFoo() %}' +
        '{% for y in [1] %}{% set x = "foo" %}{{ x }}{% endfor %}' +
        '{% endmacro %}' +
        '{% macro display() %}' +
        '{% set x = "bar" %}' +
        '{{ setFoo() }}' +
        '{{ x }}' +
        '{% endmacro %}' +
        '{{ display() }}',
        'foobar');
    });

    it('should compile macros without leaking set to calling scope', async() => {
      // This test checks that the issue #577 is resolved.
      // If the bug is not fixed, and set variables leak into the
      // caller scope, there will be too many "foo"s here ("foofoofoo"),
      // because each recursive call will append a "foo" to the
      // variable x in its caller's scope, instead of just its own.
      await equal(
        '{% macro foo(topLevel, prefix="") %}' +
        '{% if topLevel %}' +
        '{% set x = "" %}' +
        '{% for i in [1,2] %}' +
        '{{ foo(false, x) }}' +
        '{% endfor %}' +
        '{% else %}' +
        '{% set x = prefix + "foo" %}' +
        '{{ x }}' +
        '{% endif %}' +
        '{% endmacro %}' +
        '{{ foo(true) }}',
        'foofoo');
    });

    it('should compile macros that cannot see variables in caller scope', async() => {
      await equal(
        '{% macro one(var) %}{{ two() }}{% endmacro %}' +
        '{% macro two() %}{{ var }}{% endmacro %}' +
        '{{ one("foo") }}',
        '');
    });

    it('should compile call blocks', async() => {
      await equal(
        '{% macro wrap(el) %}' +
        '<{{ el }}>{{ caller() }}</{{ el }}>' +
        '{% endmacro %}' +
        '{% call wrap("div") %}Hello{% endcall %}',
        '<div>Hello</div>');
    });

    it('should compile call blocks with args', async() => {
      await equal(
        '{% macro list(items) %}' +
        '<ul>{% for i in items %}' +
        '<li>{{ caller(i) }}</li>' +
        '{% endfor %}</ul>' +
        '{% endmacro %}' +
        '{% call(item) list(["a", "b"]) %}{{ item }}{% endcall %}',
        '<ul><li>a</li><li>b</li></ul>');
    });

    it('should compile call blocks using imported macros', async() => {
      await equal(
        '{% import "import.njk" as imp %}' +
        '{% call imp.wrap("span") %}Hey{% endcall %}',
        '<span>Hey</span>');
    });

    it('should import templates', async() => {
      await equal(
        '{% import "import.njk" as imp %}' +
        '{{ imp.foo() }} {{ imp.bar }}',
        'Here\'s a macro baz');

      await equal(
        '{% from "import.njk" import foo as baz, bar %}' +
        '{{ bar }} {{ baz() }}',
        'baz Here\'s a macro');

      // TODO: Should the for loop create a new frame for each
      // iteration? As it is, `num` is set on all iterations after
      // the first one sets it
      await equal(
        '{% for i in [1,2] %}' +
        'start: {{ num }}' +
        '{% from "import.njk" import bar as num %}' +
        'end: {{ num }}' +
        '{% endfor %}' +
        'final: {{ num }}',
        'start: end: bazstart: bazend: bazfinal: ');
    });

    it('should import templates with context', async() => {
      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context.njk" as imp with context %}' +
        '{{ imp.foo() }}',
        'Here\'s BAR');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% from "import-context.njk" import foo with context %}' +
        '{{ foo() }}',
        'Here\'s BAR');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp %}' +
        '{{ bar }}',
        'BAR');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp %}' +
        '{{ imp.bar }}',
        'FOO');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp with context %}' +
        '{{ bar }}{{ buzz }}',
        'FOO');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context-set.njk" as imp with context %}' +
        '{{ imp.bar }}{{ buzz }}',
        'FOO');
    });

    it('should import templates without context', async() => {
      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context.njk" as imp without context %}' +
        '{{ imp.foo() }}',
        'Here\'s ');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% from "import-context.njk" import foo without context %}' +
        '{{ foo() }}',
        'Here\'s ');
    });

    it('should default to importing without context', async() => {
      await equal(
        '{% set bar = "BAR" %}' +
        '{% import "import-context.njk" as imp %}' +
        '{{ imp.foo() }}',
        'Here\'s ');

      await equal(
        '{% set bar = "BAR" %}' +
        '{% from "import-context.njk" import foo %}' +
        '{{ foo() }}',
        'Here\'s ');
    });

    it('should inherit templates', async() => {
      await equal('{% extends "base.njk" %}', 'FooBarBazFizzle');
      await equal('hola {% extends "base.njk" %} hizzle mumble', 'FooBarBazFizzle');

      await equal('{% extends "base.njk" %}{% block block1 %}BAR{% endblock %}',
        'FooBARBazFizzle');

      await equal(
        '{% extends "base.njk" %}' +
        '{% block block1 %}BAR{% endblock %}' +
        '{% block block2 %}BAZ{% endblock %}',
        'FooBARBAZFizzle');

      await equal('hola {% extends tmpl %} hizzle mumble',
        { tmpl: 'base.njk' },
        'FooBarBazFizzle');
    });
    it('should not call blocks not defined from template inheritance', async() => {
      var count = 0;
      await render(
        '{% extends "base.njk" %}' +
        '{% block notReal %}{{ foo() }}{% endblock %}',
        { foo: function() { count++; } },
        function() {
          expect(count).to.be(0);
        });
    });

    it('should conditionally inherit templates', async() => {
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

    it('should error if same block is defined multiple times', async() => {
      var func = async function() {
        await render(
          '{% extends "simple-base.njk" %}' +
          '{% block test %}{% endblock %}' +
          '{% block test %}{% endblock %}');
      };

      expect(func).to.throwException(/Block "test" defined more than once./);
    });

    it('should render nested blocks in child template', async() => {
      await equal(
        '{% extends "base.njk" %}' +
        '{% block block1 %}{% block nested %}BAR{% endblock %}{% endblock %}',
        'FooBARBazFizzle');
    });

    it('should render parent blocks with super()', async() => {
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

    it('should let super() see global vars from child template', async() => {
      await equal(
        '{% extends "base-show.njk" %}{% set var = "child" %}' +
        '{% block main %}{{ super() }}{% endblock %}',
        'child');
    });

    it('should not let super() see vars from child block', async() => {
      await equal(
        '{% extends "base-show.njk" %}' +
        '{% block main %}{% set var = "child" %}{{ super() }}{% endblock %}',
        '');
    });

    it('should let child templates access parent global scope', async() => {
      await equal(
        '{% extends "base-set.njk" %}' +
        '{% block main %}{{ var }}{% endblock %}',
        'parent');
    });

    it('should not let super() modify calling scope', async() => {
      await equal(
        '{% extends "base-set-inside-block.njk" %}' +
        '{% block main %}{{ super() }}{{ var }}{% endblock %}',
        '');
    });

    it('should not let child templates set vars in parent scope', async() => {
      await equal(
        '{% extends "base-set-and-show.njk" %}' +
        '{% block main %}{% set var = "child" %}{% endblock %}',
        'parent');
    });

    it('should render blocks in their own scope', async() => {
      await equal(
        '{% set var = "parent" %}' +
        '{% block main %}{% set var = "inner" %}{% endblock %}' +
        '{{ var }}',
        'parent');
    });

    it('should include templates', async() => {
      await equal('hello world {% include "include.njk" %}',
        'hello world FooInclude ');
    });

    it('should include 130 templates without call stack size exceed', async() => {
      await equal('{% include "includeMany.njk" %}',
        new Array(131).join('FooInclude \n'));
    });

    it('should include templates with context', async() => {
      await equal('hello world {% include "include.njk" %}',
        {
          name: 'james'
        },
        'hello world FooInclude james');
    });

    it('should include templates that can see including scope, but not write to it', async() => {
      await equal('{% set var = 1 %}{% include "include-set.njk" %}{{ var }}', '12\n1');
    });

    it('should include templates dynamically', async() => {
      await equal('hello world {% include tmpl %}',
        {
          name: 'thedude',
          tmpl: 'include.njk'
        },
        'hello world FooInclude thedude');
    });

    it('should include templates dynamically based on a set var', async() => {
      await equal('hello world {% set tmpl = "include.njk" %}{% include tmpl %}',
        {
          name: 'thedude'
        },
        'hello world FooInclude thedude');
    });

    it('should include templates dynamically based on an object attr', async() => {
      await equal('hello world {% include data.tmpl %}',
        {
          name: 'thedude',
          data: {
            tmpl: 'include.njk'
          }
        },
        'hello world FooInclude thedude');
    });

    it('should throw an error when including a file that does not exist', async() => {
      await render(
        '{% include "missing.njk" %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/template not found: missing.njk/);
        }
      );
    });

    it('should fail silently on missing templates if requested', async() => {
      await equal('hello world {% include "missing.njk" ignore missing %}',
        'hello world ');

      await equal('hello world {% include "missing.njk" ignore missing %}',
        {
          name: 'thedude'
        },
        'hello world ');
    });

    /**
     * This test checks that this issue is resolved: http://stackoverflow.com/questions/21777058/loop-index-in-included-nunjucks-file
     */
    it('should have access to "loop" inside an include', async() => {
      await equal('{% for item in [1,2,3] %}{% include "include-in-loop.njk" %}{% endfor %}',
        '1,0,true\n2,1,false\n3,2,false\n');

      await equal('{% for k,v in items %}{% include "include-in-loop.njk" %}{% endfor %}',
        {
          items: {
            a: 'A',
            b: 'B'
          }
        },
        '1,0,true\n2,1,false\n');
    });

    it('should maintain nested scopes', async() => {
      await equal(
        '{% for i in [1,2] %}' +
        '{% for i in [3,4] %}{{ i }}{% endfor %}' +
        '{{ i }}{% endfor %}',
        '341342');
    });

    it('should allow blocks in for loops', async() => {
      await equal(
        '{% extends "base2.njk" %}' +
        '{% block item %}hello{{ item }}{% endblock %}',
        'hello1hello2');
    });

    it('should make includes inherit scope', async() => {
      await equal(
        '{% for item in [1,2] %}' +
        '{% include "item.njk" %}' +
        '{% endfor %}',
        'showing 1showing 2');
    });

    it('should compile a set block', async() => {
      await equal('{% set username = "foo" %}{{ username }}',
        {
          username: 'james'
        },
        'foo');

      await equal('{% set x, y = "foo" %}{{ x }}{{ y }}',
        'foofoo');

      await equal('{% set x = 1 + 2 %}{{ x }}',
        '3');

      await equal('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',
        {
          foo: 2
        },
        '2');

      await equal('{% include "set.njk" %}{{ foo }}',
        {
          foo: 'bar'
        },
        'bar');

      await equal('{% set username = username + "pasta" %}{{ username }}',
        {
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

    it('should compile set with frame references', async() => {
      await equal('{% set username = user.name %}{{ username }}',
        {
          user: {
            name: 'james'
          }
        },
        'james');
    });

    it('should compile set assignments of the same variable', async() => {
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

    it('should compile block-set', async() => {
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

    it('should compile block-set wrapping an inherited block', async() => {
      await equal(
        '{% extends "base-set-wraps-block.njk" %}' +
        '{% block somevar %}foo{% endblock %}',
        'foo\n'
      );
    });

    it('should throw errors', async() => {
      await render('{% from "import.njk" import boozle %}',
        {},
        {
          noThrow: true
        },
        function(err) {
          expect(err).to.match(/cannot import 'boozle'/);
        });
    });

    it('should allow custom tag compilation', async() => {
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

      await equal('{% test %}123456789{% endtest %}', null,
        { extensions: { TestExtension: new TestExtension() } },
        '987654321');
    });

    it('should allow custom tag compilation without content', async() => {
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

      await equal('{% test "123456" %}', null,
        { extensions: { TestExtension: new TestExtension() } },
        '654321');
    });

    it('should allow complicated custom tag compilation', async() => {
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

      await equal('{% test %}abcdefg{% endtest %}', null,
        { extensions: { TestExtension: new TestExtension() } },
        'a,b,c,d,e,f,g');

      await equal('{% test %}abcdefg{% intermediate %}second half{% endtest %}',
        null,
        { extensions: { TestExtension: new TestExtension() } },
        'a,b,c,d,e,f,gflah dnoces');
    });

    it('should allow custom tag with args compilation', async() => {
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
          if (kwargs.cutoff) {
            output = output.slice(0, kwargs.cutoff);
          }

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

    it('should autoescape by default', async() => {
      await equal('{{ foo }}', {
        foo: '"\'<>&'
      }, '&quot;&#39;&lt;&gt;&amp;');
    });

    it('should autoescape if autoescape is on', async() => {
      await equal(
        '{{ foo }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '&quot;&#39;&lt;&gt;&amp;');

      await equal('{{ foo|reverse }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '&amp;&gt;&lt;&#39;&quot;');

      await equal(
        '{{ foo|reverse|safe }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '&><\'"');

      await equal(
        '{{ foo }}',
        { foo: null },
        { autoescape: true },
        '');

      await equal(
        '{{ foo }}',
        { foo: ['<p>foo</p>'] },
        { autoescape: true },
        '&lt;p&gt;foo&lt;/p&gt;');

      await equal(
        '{{ foo }}',
        { foo: { toString: function() { return '<p>foo</p>'; } } },
        { autoescape: true },
        '&lt;p&gt;foo&lt;/p&gt;');

      await equal('{{ foo | safe }}',
        { foo: null },
        { autoescape: true },
        '');

      await equal(
        '{{ foo | safe }}',
        { foo: '<p>foo</p>' },
        { autoescape: true },
        '<p>foo</p>');

      await equal(
        '{{ foo | safe }}',
        { foo: ['<p>foo</p>'] },
        { autoescape: true },
        '<p>foo</p>');

      await equal(
        '{{ foo | safe }}',
        { foo: { toString: function() { return '<p>foo</p>'; } } },
        { autoescape: true },
        '<p>foo</p>');
    });

    it('should not autoescape safe strings', async() => {
      await equal(
        '{{ foo|safe }}',
        { foo: '"\'<>&' },
        { autoescape: true },
        '"\'<>&');
    });

    it('should not autoescape macros', async() => {
      await render(
        '{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
        '{{ foo("<>&", "<>") }}',
        null,
        {
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('&lt;&gt;&amp; and &lt;&gt;');
        }
      );

      await render(
        '{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
        '{{ foo("<>&", "<>") }}',
        null,
        {
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('<>& and &lt;&gt;');
        }
      );
    });

    it('should not autoescape super()', async() => {
      await render(
        '{% extends "base3.njk" %}' +
        '{% block block1 %}{{ super() }}{% endblock %}',
        null,
        {
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('<b>Foo</b>');
        }
      );
    });

    it('should not autoescape when extension set false', async() => {
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
        null,
        {
          extensions: { TestExtension: new TestExtension() },
          autoescape: true
        },
        function(err, res) {
          expect(res).to.be('<b>Foo</b>');
        }
      );
    });

    it('should pass context as this to filters', async() => {
      await render(
        '{{ foo | hallo }}',
        { foo: 1, bar: 2 },
        {
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

    it('should render regexs', async() => {
      await equal('{{ r/name [0-9] \\// }}',
        '/name [0-9] \\//');

      await equal('{{ r/x/gi }}',
        '/x/gi');
    });

    it('should throw an error when {% call %} is passed an object that is not a function', async() => {
      await render(
        '{% call foo() %}{% endcall %}',
        {foo: 'bar'},
        {noThrow: true},
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is not a function/);
        });
    });

    it('should throw an error when including a file that calls an undefined macro', async() => {
      await render(
        '{% include "undefined-macro.njk" %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is undefined or falsey/);
        }
      );
    });

    it('should throw an error when including a file that calls an undefined macro even inside {% if %} tag', async() => {
      await render(
        '{% if true %}{% include "undefined-macro.njk" %}{% endif %}',
        {},
        {
          noThrow: true
        },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is undefined or falsey/);
        }
      );
    });

    it('should throw an error when including a file that imports macro that calls an undefined macro', async() => {
      await render(
        '{% include "import-macro-call-undefined-macro.njk" %}',
        { list: [1, 2, 3] },
        { noThrow: true },
        function(err, res) {
          expect(res).to.be(undefined);
          expect(err).to.match(/Unable to call `\w+`, which is undefined or falsey/);
        }
      );
    });


    it('should control whitespaces correctly', async() => {
      await equal(
        '{% if true -%}{{"hello"}} {{"world"}}{% endif %}',
        'hello world');

      await equal(
        '{% if true -%}{% if true %} {{"hello"}} {{"world"}}'
        + '{% endif %}{% endif %}',
        ' hello world');

      await equal(
        '{% if true -%}{# comment #} {{"hello"}}{% endif %}',
        ' hello');
    });

    it('should control expression whitespaces correctly', async() => {
      await equal(
        'Well, {{- \' hello, \' -}} my friend',
        'Well, hello, my friend'
      );

      await equal(' {{ 2 + 2 }} ', ' 4 ');

      await equal(' {{-2 + 2 }} ', '4 ');

      await equal(' {{ -2 + 2 }} ', ' 0 ');

      await equal(' {{ 2 + 2 -}} ', ' 4');
    });

    it('should get right value when macro parameter conflict with global macro name', async() => {
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
        '{{macro2("this should be outputted") }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('this should be outputted');
        });
    });

    it('should get right value when macro include macro', async() => {
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
        '{{macro2("this should not be outputted") }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('foo');
        });
    });

    it('should allow access to outer scope in call blocks', async() => {
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
        '{{ outside("foobar") }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('foobar\nfoobar');
        });
    });

    it('should not leak scope from call blocks to parent', async() => {
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
        '{{ var }}', {}, {}, function(err, res) {
          expect(res.trim()).to.eql('expected');
        });
    });


    if (!isSlim) {
      it('should import template objects', async() => {
        var tmpl = new Template('{% macro foo() %}Inside a macro{% endmacro %}' +
          '{% set bar = "BAZ" %}');

        await equal(
          '{% import tmpl as imp %}' +
          '{{ imp.foo() }} {{ imp.bar }}',
          {
            tmpl: tmpl
          },
          'Inside a macro BAZ');

        await equal(
          '{% from tmpl import foo as baz, bar %}' +
          '{{ bar }} {{ baz() }}',
          {
            tmpl: tmpl
          },
          'BAZ Inside a macro');
      });

      it('should inherit template objects', async() => {
        var tmpl = new Template('Foo{% block block1 %}Bar{% endblock %}' +
          '{% block block2 %}Baz{% endblock %}Whizzle');

        await equal('hola {% extends tmpl %} fizzle mumble',
          {
            tmpl: tmpl
          },
          'FooBarBazWhizzle');

        await equal(
          '{% extends tmpl %}' +
          '{% block block1 %}BAR{% endblock %}' +
          '{% block block2 %}BAZ{% endblock %}',
          {
            tmpl: tmpl
          },
          'FooBARBAZWhizzle');
      });

      it('should include template objects', async() => {
        var tmpl = new Template('FooInclude {{ name }}');

        await equal('hello world {% include tmpl %}',
          {
            name: 'thedude',
            tmpl: tmpl
          },
          'hello world FooInclude thedude');
      });

      it('should throw an error when invalid expression whitespaces are used', async() => {
        await render(
          ' {{ 2 + 2- }}',
          {},
          {
            noThrow: true
          },
          function(err, res) {
            expect(res).to.be(undefined);
            expect(err).to.match(/unexpected token: }}/);
          }
        );
      });
    }
  });

  describe('the filter tag', function() {
    it('should apply the title filter to the body', async() => {
      await equal('{% filter title %}may the force be with you{% endfilter %}',
        'May The Force Be With You');
    });

    it('should apply the replace filter to the body', async() => {
      await equal('{% filter replace("force", "forth") %}may the force be with you{% endfilter %}',
        'may the forth be with you');
    });

    it('should work with variables in the body', async() => {
      await equal('{% set foo = "force" %}{% filter replace("force", "forth") %}may the {{ foo }} be with you{% endfilter %}',
        'may the forth be with you');
    });

    it('should work with blocks in the body', async() => {
      await equal(
        '{% extends "filter-block.html" %}' +
        '{% block block1 %}force{% endblock %}',
        'may the forth be with you\n');
    });
  });
}());

