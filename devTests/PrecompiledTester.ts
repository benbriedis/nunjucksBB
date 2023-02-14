import nunjucks from '../src/index';

/* This script can run on the server */

class PrecompiledTester
{
	static async run():Promise<void>
	{
		const contents = '{% include "missing.njk" ignore missing %}';

		const precompiled = nunjucks.precompileString(contents,{name:'top.njk'});

		global.window = <any>{};
		const func = new Function(precompiled);
		func();

		console.log('window:',window);

		console.log('precompiled:',precompiled);

		console.log('XXXX',(<any>window).nunjucksPrecompiled);

		const env = new nunjucks.Environment(new nunjucks.PrecompiledLoader(window.nunjucksPrecompiled),{
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});

		const template = await env.getTemplate('top.njk'); 
		const result = await template.render({});
		console.log('result:',result);
	}
}

PrecompiledTester.run().catch(err => console.log(err));

