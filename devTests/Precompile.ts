import * as nunjucks from '../src/index.js';
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

		await this.compileOne('devTests/brokenTop.njk',env);
		await this.compileOne('devTests/brokenImport1.njk',env);
		await this.compileOne('devTests/brokenImport2.njk',env);
		await this.compileOne('devTests/brokenInclude.njk',env);
	}

	static async compileOne(templateName,env)
	{
		const handle = await open(templateName,'r');
		const contents = await handle.readFile({encoding:'UTF-8' as BufferEncoding});
//XXX does 'precompile()' not work?
		const compiled = nunjucks.precompileString(contents,{name:templateName,env:env});
		console.log(compiled);

		await handle.close();
	}
}

Precompile.run().catch(err => console.log(err));

