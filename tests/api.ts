import expect from 'expect.js';
import * as util from './util';
import Environment from '../src/runtime/Environment';
import Loader from '../src/loaders/FileSystemLoader';
import path from 'path';

const templatesPath = 'tests/templates';

describe('api', () => {
	it('should always force compilation of parent template', async () => {
		var env = new Environment(new Loader(templatesPath));

		var child = await env.getTemplate('base-inherit.njk');
		expect(await child.render()).to.be('Foo*Bar*BazFizzle\n');
	});

	it('should handle correctly relative paths', async () => {
		const env = new Environment(new Loader(templatesPath));
		const child1 = await env.getTemplate('relative/test1.njk');
		const child2 = await env.getTemplate('relative/test2.njk');

		expect(await child1.render()).to.be('FooTest1BazFizzle\n');
		expect(await child2.render()).to.be('FooTest2BazFizzle\n');
	});

	it('should handle correctly cache for relative paths', async () => {
		const env = new Environment(new Loader(templatesPath));
		const test = await env.getTemplate('relative/test-cache.njk');

		expect(util.normEOL(await test.render())).to.be('Test1\nTest2');
	});

	it('should handle correctly relative paths in renderString', async () => {
		const env = new Environment(new Loader(templatesPath));
		expect(await env.renderString('{% extends "./relative/test1.njk" %}{% block block1 %}Test3{% endblock %}', {}, {
			path: path.resolve(templatesPath, 'string.njk')
		})).to.be('FooTest3BazFizzle\n');
	});
});
