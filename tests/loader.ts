import expect from 'expect.js';
import Environment from '../src/Environment';
import WebLoader from '../src/WebLoader';
import FileSystemLoader from '../src/FileSystemLoader';

const templatesPath = 'tests/templates';


describe('loader', function() {
	it('should allow a simple loader to be created', async () => {
		// From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
		// We should be able to create a loader that only exposes getSource
		var env, parent;

		function MyLoader() {
			// configuration
		}

		MyLoader.prototype.getSource = function() {
			return {
				src: 'Hello World',
				path: '/tmp/somewhere'
			};
		};

		env = new Environment(new MyLoader());
		parent = await env.getTemplate('fake.njk');
		expect(await parent.render()).to.be('Hello World');
	});

	it('should catch loader error', async () => {
		// From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
		// We should be able to create a loader that only exposes getSource
		var env;

		function MyLoader() {
			// configuration
			this.async = true;
		}

		MyLoader.prototype.getSource = async function() {
			throw new Error('test');
		};

		env = new Environment(new MyLoader());
		try {
			parent = await env.getTemplate('fake.njk');
			//FIXME add 'not here' test
		} catch (err) {
			expect(err).to.be.a(Error);
		}
	});

//TODO should be able to test on server, possibly using a mock object or two
	describe('WebLoader', function() {
		it('should have default opts for WebLoader', async () => {
			var webLoader = new WebLoader(templatesPath);
			expect(webLoader).to.be.a(WebLoader);
			expect(webLoader.useCache).to.be(false);
		});

		it('should emit a "load" event', async () => {
			var loader = new WebLoader(templatesPath);

			if (typeof window === 'undefined') 
				return;

			loader.on('load', function(name, source) {
				expect(name).to.equal('simple-base.njk');
			});

			loader.getSource('simple-base.njk');
		});
	});

	if (typeof FileSystemLoader !== 'undefined') {
		describe('FileSystemLoader', function() {
			it('should have default opts', async () => {
				var loader = new FileSystemLoader(templatesPath);
				expect(loader).to.be.a(FileSystemLoader);
				expect(loader.noCache).to.be(false);
			});

			it('should emit a "load" event', async () => {
				var loader = new FileSystemLoader(templatesPath);
				loader.on('load', function(name, source) {
					expect(name).to.equal('simple-base.njk');
				});

				loader.getSource('simple-base.njk');
			});
		});
	}
});
