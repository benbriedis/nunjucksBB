import Nunjucks,{NullLoader} from '../src/all.js';
import {open} from 'fs/promises';

export default class Precompile
{
	static async run():Promise<void>
	{
//TODO shoud probably be able to use FileSystemLoader here and do away with readFile() below	
		const env = new Nunjucks(new NullLoader(),
			{
				trimBlocks:true,
				lstripBlocks:true
				//throwOnUndefined:true
			});

		await this.compileOne('devTests/top.njk',env);
		await this.compileOne('devTests/middle.njk',env);
/*		
		await this.compileOne('devTests/brokenTop.njk',env);
		await this.compileOne('devTests/brokenImport1.njk',env);
		await this.compileOne('devTests/brokenImport2.njk',env);
		await this.compileOne('devTests/brokenInclude.njk',env);
*/		
	}

	static async compileOne(templateName:string,env)
	{
		const handle = await open(templateName,'r');
		const contents = await handle.readFile({encoding:'UTF-8' as BufferEncoding});
//XXX does 'precompile()' not work?
		const compiled = env.precompileString(contents,{name:templateName,env:env});
		console.log(compiled);

		await handle.close();
	}
}

Precompile.run().catch(err => console.log(err));

