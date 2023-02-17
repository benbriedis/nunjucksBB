import expect from 'expect.js';
import Environment from '../src/runtime/Environment';
import Loader from '../src/loaders/Loader';
import WebLoader from '../src/loaders/WebLoader';
import FileSystemLoader from '../src/loaders/FileSystemLoader';

const templatesPath = 'tests/templates';


describe('loader', function() {
	it('should allow a simple loader to be created', async () => {
		// From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
		// We should be able to create a loader that only exposes getSource
		var env, parent;

		class MyLoader extends Loader {
			async getSource(name:string) {
				return {
					src: 'Hello World',
					path: '/tmp/somewhere',
					noCache: true
				}
			}
		}

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
	});

	if (typeof FileSystemLoader !== 'undefined') {
		describe('FileSystemLoader', function() {
			it('should have default opts', async () => {
				var loader = new FileSystemLoader(templatesPath);
				expect(loader).to.be.a(FileSystemLoader);
				expect(loader.noCache).to.be(false);
			});
		});
	}
});
