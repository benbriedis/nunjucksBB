import nunjucks from '../src/index.js';
import {open} from 'fs/promises';
//import nunjucks from 'nunjucks';
//import NunjucksExtensions from 'Browser/NunjucksEnv';


/*
	The idea of this one is to test precompiled templates on the server.

	TODO remove dependency on window
 */

export default class ServerTester
{
	static async run():Promise<void>
	{
		const compiledName = 'compiledTop.njk.js';

		const handle = await open(compiledName,'r');
		const contents = await handle.readFile({encoding:'UTF-8' as BufferEncoding});
		await handle.close();

console.log('GOT CONTENTS:',contents);		


// These loaders should be pulled apart a bit, and the on-demand loading should be separated out a bit more (including chokidar)


//TODO		EXECUTE contents

//XXX Can I pass in a 'null' loader instead? I suspect that a cache is used in this case...
//XXX is using something window.nunjucksPrecompiled to access

//XXX can I use one of the other loaders?

		const env = new nunjucks.Environment(new nunjucks.WebLoader('/xxxx'),{
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});
//		NunjucksExtensions.extend(this.env);

		const templateName = 'devTests/top.njk';
		const data = {
			a:1,
			b:2
		};

//XXX can/should I combine these two?
		const template = await env.getTemplate(templateName,true);   //XXX true?
		const content = await template.render(data);

		console.log(content);
	}
}

ServerTester.run().catch(err => console.log(err));

