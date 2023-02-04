import nunjucks from '../src/index.js';
//import nunjucks from 'nunjucks';
//import NunjucksExtensions from 'Browser/NunjucksEnv';

//export default class RunPrecompiled    XXX would be useful if I had a 2nd one I could run on the server
export default class BrowserTester
{
	static async run():Promise<void>
	{
		const compiledName = 'compiledTop.njk.js';

//FIXME WebLoader refuses to run on the server 
//      Also the templates refuse to run on the server. Makes testing difficult (especially automatic testing I think)

// These loaders should be pulled apart a bit, and the on-demand loading should be separated out a bit more (including chokidar)


//TODO		EXECUTE contents

//XXX Can I pass in a 'null' loader instead? I suspect that a cache is used in this case...
//XXX is using something window.nunjucksPrecompiled to access

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

BrowserTester.run().catch(err => console.log(err));

