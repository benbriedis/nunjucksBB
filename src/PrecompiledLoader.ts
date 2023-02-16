import Loader from './Loader';

export default class PrecompiledLoader extends Loader 
{
	precompiled;

	constructor(compiledTemplates) 
	{
		super();
		this.precompiled = compiledTemplates || {};
	}

	async getSource(name:string):Promise<any|null>
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

