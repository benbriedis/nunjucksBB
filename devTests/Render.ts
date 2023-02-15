
//TODO include nunjucks from GITHUB or neigbouring directory

/*
	Installed using: 
		npm i https://github.com/benbriedis/nunjucksBB
	For more see:
		 https://www.pluralsight.com/guides/install-npm-packages-from-gitgithub
*/

import * as nunjucks from '../src/index.js';

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

	//const myNunjucksEnv = new nunjucks.Environment(loader,{trimBlocks:true,lstripBlocks:true});
	//NunjucksExtensions.extend(this.myNunjucksEnv);


//global.go = true;
		const result = await nunjucks.render(templateName,data);

		console.log('result:',result);	
	}
}

Render.run().catch(err => console.log(err));

