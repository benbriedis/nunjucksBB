import expect from 'expect.js';
import {equal,render} from './util';
import Environment from '../src/Environment';
import assert from 'assert';
import TemplateError from '../src/TemplateError';


describe('global', function() {
	it('should have range', async () => {
		await equal('{% for i in range(0, 10) %}{{ i }}{% endfor %}', '0123456789');
		await equal('{% for i in range(10) %}{{ i }}{% endfor %}', '0123456789');
		await equal('{% for i in range(5, 10) %}{{ i }}{% endfor %}', '56789');
		await equal('{% for i in range(-2, 0) %}{{ i }}{% endfor %}', '-2-1');
		await equal('{% for i in range(5, 10, 2) %}{{ i }}{% endfor %}', '579');
		await equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');
		await equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');

		await equal('{% for i in range(10, 5, -1) %}{{ i }}{% endfor %}', '109876');
		await equal('{% for i in range(10, 5, -2.5) %}{{ i }}{% endfor %}', '107.5');
	});

	it('should have cycler', async () => {
		await equal(
			'{% set cls = cycler("odd", "even") %}' +
			'{{ cls.next() }}' +
			'{{ cls.next() }}' +
			'{{ cls.next() }}',
			'oddevenodd');

		await equal(
			'{% set cls = cycler("odd", "even") %}' +
			'{{ cls.next() }}' +
			'{{ cls.reset() }}' +
			'{{ cls.next() }}',
			'oddodd');

		await equal(
			'{% set cls = cycler("odd", "even") %}' +
			'{{ cls.next() }}' +
			'{{ cls.next() }}' +
			'{{ cls.current }}',
			'oddeveneven');
	});

	it('should have joiner', async () => {
		await equal(
			'{% set comma = joiner() %}' +
			'foo{{ comma() }}bar{{ comma() }}baz{{ comma() }}',
			'foobar,baz,');

		await equal(
			'{% set pipe = joiner("|") %}' +
			'foo{{ pipe() }}bar{{ pipe() }}baz{{ pipe() }}',
			'foobar|baz|');
	});

	it('should allow addition of globals', async () => {
		var env = new Environment();

		env.addGlobal('hello', function(arg1) {
			return 'Hello ' + arg1;
		});

		await equal('{{ hello("World!") }}', 'Hello World!', env);
	});

	it('should allow chaining of globals', async () => {
		var env = new Environment();

		env.addGlobal('hello', function(arg1) {
			return 'Hello ' + arg1;
		}).addGlobal('goodbye', function(arg1) {
			return 'Goodbye ' + arg1;
		});

		await equal('{{ hello("World!") }}', 'Hello World!', env);
		await equal('{{ goodbye("World!") }}', 'Goodbye World!', env);
	});

	it('should allow getting of globals', async () => {
		var env = new Environment();
		var hello = function(arg1) {
			return 'Hello ' + arg1;
		};

		env.addGlobal('hello', hello);

		expect(env.getGlobal('hello')).to.be.equal(hello);
	});

	it('should allow getting boolean globals', async () => {
		var env = new Environment();
		var hello = false;

		env.addGlobal('hello', hello);

		expect(env.getGlobal('hello')).to.be.equal(hello);
	});

	it('should fail on getting non-existent global', async () => {
		var env = new Environment();

		// Using this format instead of .withArgs since env.getGlobal uses 'this'
		expect(function() {
			env.getGlobal('hello');
		}).to.throwError();
	});

	it('should pass context as this to global functions', async () => {
		var env = new Environment();

		env.addGlobal('hello', function() {
			return 'Hello ' + this.lookup('user');
		});

		await equal('{{ hello() }}', {
			user: 'James'
		}, 'Hello James', env);
	});

	it('should be exclusive to each environment', async () => {
		var env = new Environment();
		var env2;

		env.addGlobal('hello', 'konichiwa');
		env2 = new Environment();

		// Using this format instead of .withArgs since env2.getGlobal uses 'this'
		expect(function() {
			env2.getGlobal('hello');
		}).to.throwError();
	});

	it('should return errors from globals', async () => {
		var env = new Environment();

		env.addGlobal('err', function() {
			throw new Error('Global error');
		});

		const promise = render('{{ err() }}', null, {}, env);
		await assert.rejects(promise, new TemplateError('Global error','undefined',0,6));
	});
});
