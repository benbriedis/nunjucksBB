import nunjucks from '../index.js';
import {open} from 'fs/promises';
//import nunjucks from 'nunjucks';
//import NunjucksExtensions from 'Browser/NunjucksEnv';

export default class Precompile
{
	static async run():Promise<void>
	{
		const env = nunjucks.configure({
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});
//		NunjucksExtensions.extend(this.env);

		const templateName = 'nunjucks/devTests/top.njk';
		const data = {
			a:1,
			b:2
		};

		const handle = await open(templateName,'r');
		const contents = await handle.readFile({encoding:'UTF-8' as BufferEncoding});
//XXX does 'precompile()' not work?
		const compiled = nunjucks.precompileString(contents,{name:templateName,env:env});
		console.log(compiled);

		await handle.close();
	}
}

Precompile.run().catch(err => console.log(err));

