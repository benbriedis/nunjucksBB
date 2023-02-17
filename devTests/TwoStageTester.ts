import * as nunjucks from '../src/all';
import {Environment} from '../src/all';

/* This script can run on the server */

class TwoStageTester
{
	static async run():Promise<void>
	{
//		let env2: nunjucks.Environment;
		let env2: Environment;

		const contents = 'HERE {{ middle }} THERE';

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
		const result = await template.render({middle:'and'});
		console.log('result:',result);
	}
}

TwoStageTester.run().catch(err => console.log(err));

