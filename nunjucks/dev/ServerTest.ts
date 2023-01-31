
//TODO include nunjucks from GITHUB or neigbouring directory

/*
	Installed using: 
		npm i https://github.com/benbriedis/nunjucksBB
	For more see:
		 https://www.pluralsight.com/guides/install-npm-packages-from-gitgithub
*/

//import {render},nunjucks from 'nunjucksBB';
//import {render} from 'nunjucksBB';
//import nunjucks from 'nunjucksBB';
import nunjucks from '../index.js';

class ServerTest
{

	static async run():Promise<void>
	{
		const templateName = 'nunjucks/dev/top.njk';
		const data = {
			a:1,
			b:2
		};

//TRY WITHOUT A Custom loader initially
	//const loader = new CustomAsyncNunjucksLoader(this,aliases);
	//const myNunjucksEnv = new nunjucks.Environment(loader,{trimBlocks:true,lstripBlocks:true});
	//NunjucksExtensions.extend(this.myNunjucksEnv);

//XXX 
//	var env = new nunjucks.Environment(new nunjucks.FileSystemLoader(templateName));

//	const result = await nunjucks.render(templateName,data);
//console.log('HERE  nunjucks:',nunjucks);
//	const result = nunjucks.render(templateName,data);  //XXX top level 'nunjucks' not working...
	const result = nunjucks.render(templateName,data);

console.log('result:',result);	



//XXX might be better just to call 'render' as getting a template may not solve that much of a purpose...
//    esp if incudes are within loop and have to mutiply retrieve and render...

	//const template = await nunjucksEnv.getTemplate(templateName,true);   //XXX whats true?

	//const result = await template.render(data);


	//load in a few files asynchronously and render

	}
}

//TODO a BrowserTest
//TODO incorporate the TS definitions in the project (any way to share with the slim version?)


ServerTest.run().catch(err => console.log(err));
