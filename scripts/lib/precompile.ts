import fs from 'fs';
import path from 'path';
import {precompile} from '../../src/precompile';

var testDir = path.join(__dirname, '../../tests');

export default async function precompileTestTemplates():Promise<void> 
{
	const output = precompile(path.join(testDir, 'templates'), {
		include: [/\.(njk|html)$/],
	});

//TODO remove sync	
	fs.writeFileSync(path.join(testDir,'browser/precompiled-templates.js'),output);
}

