import Nunjucks,{NullLoader,PrecompiledLoader} from '../src/all';

/* This script can run on the server */

class TwoStageTester
{
	static async run():Promise<void>
	{
		const contents = 'HERE {{ middle }} THERE';

		const env1 = new Nunjucks(new NullLoader());
		const precompiled = env1.precompileString(contents,{name:'top.njk'});

		global.window = <any>{};
		const func = new Function(precompiled);
		func();

		console.log('window:',window);

		console.log('precompiled:',precompiled);

		console.log('XXXX',(<any>window).nunjucksPrecompiled);

		const env2 = new Nunjucks(new PrecompiledLoader(window.nunjucksPrecompiled),{
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});

		const template = await env2.getTemplate('top.njk'); 
		const result = await template.render({middle:'and'});
		console.log('result:',result);
	}
}

TwoStageTester.run().catch(err => console.log(err));

