import SlimTemplate from './SlimTemplate';
import compiler from '../compiler/Compiler';

export default class Template extends SlimTemplate
{
	public async init(eagerCompile:boolean)
	{
		if (eagerCompile) 
			await this._compile();
		else 
			this.compiled = false;
	}

	async compile() 
	{
		if (!this.compiled) 
			await this._compile();
	}

	private async _compile() 
	{
		var props;

		if (this.tmplProps) 
			props = this.tmplProps;
		else {
//if (global.go) console.log('_compile()  CALLING compiler.compile()  this.path:',this.path,'tmplStr:',this.tmplStr,'.');	
			const source = compiler.compile(this.tmplStr,
				this.env.extensionsList,
				this.path,
				this.env.opts);

//if (global.go) console.log('_compile() source:',source);	

			const func = new Function(source); // eslint-disable-line no-new-func
			props = await func();
		}

		this.blocks = this._getBlocks(props);
		this.rootRenderFunc = props.root;
		this.compiled = true;
	}
}

