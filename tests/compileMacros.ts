import 'mocha';
import {equal} from './util';

export function testCompileMacros()
{

	it('should compile macros', async () => {
		await equal(
			'{% macro foo() %}This is a macro{% endmacro %}' +
			'{{ foo() }}',
			'This is a macro');
	});

	it('should compile macros with optional args', async () => {
		await equal(
			'{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
			'{{ foo(1) }}',
			'');
	});

	it('should compile macros with args that can be passed to filters', async () => {
		await equal(
			'{% macro foo(x) %}{{ x|title }}{% endmacro %}' +
			'{{ foo("foo") }}',
			'Foo');
	});

	it('should compile macros with positional args', async () => {
		await equal(
			'{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
			'{{ foo(1, 2) }}',
			'2');
	});

	it('should compile macros with arg defaults', async () => {
		await equal(
			'{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
			'{{ foo(1, 2) }}',
			'2');
		await equal(
			'{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
			'{{ foo(1, 2) }}',
			'5');
	});

	it('should compile macros with keyword args', async () => {
		await equal(
			'{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
			'{{ foo(1, y=2) }}',
			'2');
	});

	it('should compile macros with only keyword args', async () => {
		await equal(
			'{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
			'{% endmacro %}' +
			'{{ foo(x=1, y=2) }}',
			'125');
	});

	it('should compile macros with keyword args overriding defaults', async () => {
		await equal(
			'{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
			'{% endmacro %}' +
			'{{ foo(x=1, y=2, z=3) }}',
			'123');
	});

	it('should compile macros with out-of-order keyword args', async () => {
		await equal(
			'{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
			'{% endmacro %}' +
			'{{ foo(1, z=3) }}',
			'123');
	});

	it('should compile macros', async () => {
		await equal(
			'{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
			'{% endmacro %}' +
			'{{ foo(1) }}',
			'125');
	});

	it('should compile macros with multiple overridden arg defaults', async () => {
		await equal(
			'{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
			'{% endmacro %}' +
			'{{ foo(1, 10, 20) }}',
			'11020');
	});

	it('should compile macro calls inside blocks', async () => {
		await equal(
			'{% extends "base.njk" %}' +
			'{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
			'{% endmacro %}' +
			'{% block block1 %}' +
			'{{ foo(1) }}' +
			'{% endblock %}',
			'Foo125BazFizzle');
	});

	it('should compile macros defined in one block and called in another', async () => {
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

	it('should compile macros that include other templates', async () => {
		await equal(
			'{% macro foo() %}{% include "include.njk" %}{% endmacro %}' +
			'{{ foo() }}', {
				name: 'james'
			},
			'FooInclude james');
	});

	it('should compile macros that set vars', async () => {
		await equal(
			'{% macro foo() %}{% set x = "foo"%}{{ x }}{% endmacro %}' +
			'{% set x = "bar" %}' +
			'{{ x }}' +
			'{{ foo() }}' +
			'{{ x }}',
			'barfoobar');
	});

	it('should not leak variables set in macro to calling scope', async () => {
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

	it('should not leak variables set in nested scope within macro out to calling scope', async () => {
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

	it('should compile macros without leaking set to calling scope', async () => {
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

	it('should compile macros that cannot see variables in caller scope', async () => {
		await equal(
			'{% macro one(var) %}{{ two() }}{% endmacro %}' +
			'{% macro two() %}{{ var }}{% endmacro %}' +
			'{{ one("foo") }}',
			'');
	});

	it('should compile call blocks', async () => {
		await equal(
			'{% macro wrap(el) %}' +
			'<{{ el }}>{{ caller() }}</{{ el }}>' +
			'{% endmacro %}' +
			'{% call wrap("div") %}Hello{% endcall %}',
			'<div>Hello</div>');
	});

	it('should compile call blocks with args', async () => {
		await equal(
			'{% macro list(items) %}' +
			'<ul>{% for i in items %}' +
			'<li>{{ caller(i) }}</li>' +
			'{% endfor %}</ul>' +
			'{% endmacro %}' +
			'{% call(item) list(["a", "b"]) %}{{ item }}{% endcall %}',
			'<ul><li>a</li><li>b</li></ul>');
	});

	it('should compile call blocks using imported macros', async () => {
		await equal(
			'{% import "import.njk" as imp %}' +
			'{% call imp.wrap("span") %}Hey{% endcall %}',
			'<span>Hey</span>');
	});

	it('should import templates', async () => {
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

	it('should import templates with context', async () => {
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

	it('should import templates without context', async () => {
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

	it('should default to importing without context', async () => {
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
}

