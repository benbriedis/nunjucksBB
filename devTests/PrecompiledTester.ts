//import Nunjucks,{PrecompiledLoader} from '../src/all';
//import Nunjucks,{PrecompiledLoader} from '../../dists/nunjucks-slim.js';


//import Nunjucks,{PrecompiledLoader} from '../src/slim';
//import {PrecompiledLoader,SlimEnvironment as Nunjucks} from '../src/slim';
import SlimNunjucks,{PrecompiledLoader} from '../src/slim';
import {readFile} from 'fs/promises';

/* This script can run on the server */

class PrecompiledTester
{
	static async run():Promise<void>
	{
		const precompiled = await readFile('./devTests/broken.njk.js',{encoding:'UTF8' as BufferEncoding});

		global.window = <any>{};
		const func = new Function(precompiled);
		await func();

//		console.log('window:',window);
//		console.log('precompiled:',precompiled);
//		console.log('XXXX',(<any>window).nunjucksPrecompiled);

		const env = new SlimNunjucks(new PrecompiledLoader(window.nunjucksPrecompiled),{
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});

		const result = await env.render('devTests/brokenTop.njk',{blah:1}); 
//		const template = await env.getTemplate('devTests/brokenTop.njk'); 
//console.log('template:',template);
//		const result = await template.render({blah:1});
		console.log('result:',result);
	}
}

PrecompiledTester.run().catch(err => console.log(err));

