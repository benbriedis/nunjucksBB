import 'mocha';
import {equal} from './util';

export function testFilterTag()
{
	describe('the filter tag', function() {
		it('should apply the title filter to the body', async () => {
			await equal('{% filter title %}may the force be with you{% endfilter %}',
				'May The Force Be With You');
		});

		it('should apply the replace filter to the body', async () => {
			await equal('{% filter replace("force", "forth") %}may the force be with you{% endfilter %}',
				'may the forth be with you');
		});

		it('should work with variables in the body', async () => {
			await equal('{% set foo = "force" %}{% filter replace("force", "forth") %}may the {{ foo }} be with you{% endfilter %}',
				'may the forth be with you');
		});

		it('should work with blocks in the body', async () => {
			await equal(
				'{% extends "filter-block.html" %}' +
				'{% block block1 %}force{% endblock %}',
				'may the forth be with you\n');
		});
	});
}	

