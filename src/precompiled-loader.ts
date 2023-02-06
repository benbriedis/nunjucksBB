'use strict';

import Loader from './loader';

export class PrecompiledLoader extends Loader 
{
	precompiled;

	constructor(compiledTemplates) 
	{
		super();
		this.precompiled = compiledTemplates || {};
	}

	async getSource(name):Promise<any|null>
	{
		if (this.precompiled[name]) 
			return {
				src: {
					type: 'code',
					obj: this.precompiled[name]
				},
				path: name
			};
		return null;
	}
}

