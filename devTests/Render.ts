
//TODO include nunjucks from GITHUB or neigbouring directory

/*
	Installed using: 
		npm i https://github.com/benbriedis/nunjucksBB
	For more see:
		 https://www.pluralsight.com/guides/install-npm-packages-from-gitgithub
*/

import * as nunjucks from '../src/all.js';

class Render
{

	static async run():Promise<void>
	{
//		const templateName = 'devTests/top.njk';
		const templateName = 'devTests/brokenTop.njk';
		const data = {
			a:1,
			b:2
		};


//global.go = true;

		const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(['.'],{}),
			{trimBlocks:true,lstripBlocks:true});
		//NunjucksExtensions.extend(this.myNunjucksEnv);

		const result = await env.render(templateName,data);

		console.log('result:',result);	
	}
}

Render.run().catch(err => console.log(err));

