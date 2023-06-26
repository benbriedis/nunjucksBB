//declare module '../dist/nunjucks-slim.min.js';


import SlimNunjucksEnv from '../dist/nunjucks-slim.js';
//import {PrecompiledLoader} from '../dist/nunjucks-slim.js';

console.log('In BrowserPrecompiledTest - 1');

console.log('SlimNunjucksEnv:',SlimNunjucksEnv);

//XXX currently this seems to be bundling up SlimNunjucksEnv as well... Duplication?

var PrecompiledLoader = <any>null;

class BrowserPrecompiledTest
{
	static async run():Promise<void>
	{
console.log('In BrowserTester.run() - 1');

		const compiledName = 'compiledTop.njk.js';

console.log('In BrowserTester.run() - 2');

		const loader = new PrecompiledLoader(window.nunjucksPrecompiled);
		const env = new SlimNunjucksEnv(loader, {
			trimBlocks:true,
			lstripBlocks:true
			//throwOnUndefined:true
		});
//		NunjucksExtensions.extend(this.env);

		const templateName = '/devTests/top.njk';
		const data = {
			a:1,
			b:2
		};

console.log('In BrowserTester.run() - 3');
//XXX can/should I combine these two?
		const template = await env.getTemplate(templateName,true);   //XXX true?

console.log('In BrowserTester.run() - 4  template:',template);

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

console.log('In BrowserPrecompiledTest - 5');

BrowserPrecompiledTest.run().catch(err => console.log(err));

