import SlimNunjucks,{PrecompiledLoader} from '../src/slim';
import {readFile} from 'fs/promises';

/* This script can run on the server */

class PrecompiledTester
{
	static async run():Promise<void>
	{
		const precompiled = await readFile('/devTests/compiledTop.njk.js',{encoding:'UTF8' as BufferEncoding});

		global.window = <any>{};
		const func = new Function(precompiled);
		await func();

		const env = new SlimNunjucks(new PrecompiledLoader(window.nunjucksPrecompiled),{
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});

		const result = await env.render('devTests/top.njk',{a:1,b:2}); 
		console.log('result:',result);
	}
}

PrecompiledTester.run().catch(err => console.log(err));

