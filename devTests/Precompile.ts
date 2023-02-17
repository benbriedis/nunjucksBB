import * as nunjucks from '../src/all.js';
import {open} from 'fs/promises';

export default class Precompile
{
	static async run():Promise<void>
	{
		const env = new nunjucks.Environment(
			new nunjucks.FileSystemLoader(['.'],{}),
			{
				trimBlocks:true,
				lstripBlocks:true
				//throwOnUndefined:true
			});

		await this.compileOne('devTests/brokenTop.njk',env);
		await this.compileOne('devTests/brokenImport1.njk',env);
		await this.compileOne('devTests/brokenImport2.njk',env);
		await this.compileOne('devTests/brokenInclude.njk',env);
	}

	static async compileOne(templateName:string,env)
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

