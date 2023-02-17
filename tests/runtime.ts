import {render} from './util';
import assert from 'assert';
import TemplateError from '../src/runtime/TemplateError';

/*
		process.on('uncaughtException', err => {
			console.log('Uncaught exception:',err);
			console.log('STACK:',err?.stack);
			process.exit(1);
		});
*/		



describe('runtime', function() {
	it('should report the failed function calls to symbols', async function() {
		const promise = render('{{ foo("cvan") }}',{});
		await assert.rejects(promise,'Unable to call `foo`, which is undefined');
	});

	it('should report the failed function calls to lookups', async function() {
		const promise = render('{{ foo["bar"]("cvan") }}', {});

		await assert.rejects(promise,new TemplateError('Unable to call `foo["bar"]`, which is undefined or falsey','undefined',0,13));
	});

	it('should report the failed function calls to calls', async function() {
		const promise = render('{{ foo.bar("second call") }}');
		await assert.rejects(promise,'foo\["bar"\]');
	});

	it('should report full function name in error', async function() {
		const promise = render('{{ foo.barThatIsLongerThanTen() }}', {});

		await assert.rejects(promise,'foo\["barThatIsLongerThanTen"\]');
	});

	it('should report the failed function calls w/multiple args', async function() {
		const promise = render('{{ foo.bar("multiple", "args") }}', {});
		await assert.rejects(promise,'foo\["bar"\]');

		const promise2 = render('{{ foo["bar"]["zip"]("multiple", "args") }}', {});
		await assert.rejects(promise2,'foo\["bar"\]\["zip"\]');
	});

	it('should allow for undefined macro arguments in the last position', async function() {
		const result = await render('{% macro foo(bar, baz) %}' +
			'{{ bar }} {{ baz }}{% endmacro %}' +
			'{{ foo("hello", nosuchvar) }}', {});
		assert.equal(typeof result,'string');
	});

	it('should allow for objects without a prototype macro arguments in the last position', async function() {
		var noProto = Object.create(null);
		noProto.qux = 'world';

		const result = await render('{% macro foo(bar, baz) %}' +
			'{{ bar }} {{ baz.qux }}{% endmacro %}' +
			'{{ foo("hello", noProto) }}', {
				noProto: noProto
			});
		assert.equal(result,'hello world');
	});

	it('should not read variables property from Object.prototype', async function() {
		var payload = 'function(){ return 1+2; }()';
		var data = {};
		Object.getPrototypeOf(data).payload = payload;

		const result = await render('{{ payload }}', data);
		assert(result,payload);

		delete Object.getPrototypeOf(data).payload;
	});
});

