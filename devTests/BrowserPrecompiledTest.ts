//declare module '../dist/nunjucks-slim.min.js';

//import SlimNunjucks from 'SlimNunjucks';
/* The slim version is hopefully used here */
//import NunjucksBB,{PrecompiledLoader} from 'nunjucksBB';

//import SlimNunjucksEnv from '../dist/nunjucks-slim.js';
//import {PrecompiledLoader} from '../dist/nunjucks-slim.js';

//XXX currently this seems to be bundling up SlimNunjucksEnv as well... Duplication?

const NunjucksBB = window.nunjucksBB.SlimEnvironment;
const PrecompiledLoader = window.nunjucksBB.PrecompiledLoader;



class BrowserPrecompiledTest
{
	static async run():Promise<void>
	{
		const compiledName = 'compiledTop.njk.js';

//console.log('In BrowserTester.run() - 2  PrecompiledLoader:',PrecompiledLoader);
//console.log('In BrowserTester.run() - 2  NunjucksBB:',NunjucksBB);

		const loader = new PrecompiledLoader(window.nunjucksPrecompiled);
		const env = new NunjucksBB(loader, {
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

try {
		const content = await template.render(data);
		console.log('content:',content);
}
catch(err) {
console.log('GOT ERROR:',err);
}

		console.log('DONE');
	}
}

BrowserPrecompiledTest.run().catch(err => console.log(err));

