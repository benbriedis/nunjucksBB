import expect from 'expect.js';
import Environment from '../src/runtime/Environment';
import NullLoader from '../src/loaders/NullLoader';

describe('precompile', function() {
	it('should return a string', function() {
		const env = new Environment(new NullLoader(),{});
		expect(env.precompileString('{{ test }}', {
			name: 'test.njk'
		})).to.be.an('string');
	});

	describe('templates', function() {
		it('should return *NIX path seperators', function() {
			var fileName;

			const env = new Environment(new NullLoader(),{});
			env.precompile('./tests/templates/item.njk', {
				wrapper: function(templates) {
					fileName = templates[0].name;
				}
			});

			expect(fileName).to.equal('./tests/templates/item.njk');
		});

		it('should return *NIX path seperators, when name is passed as option', function() {
			var fileName;

			const env = new Environment(new NullLoader(),{});
			env.precompile('<span>test</span>', {
				name: 'path\\to\\file.j2',
				isString: true,
				wrapper: function(templates) {
					fileName = templates[0].name;
				}
			});

			expect(fileName).to.equal('path/to/file.j2');
		});
	});
});
