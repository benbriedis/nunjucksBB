import * as lib from './lib';
import * as globalRuntime from './runtime';
import SlimEnvironment from './SlimEnvironment';
import Frame from './Frame';
import Context from './Context';

export default class SlimTemplate
{
	env:SlimEnvironment;
	path;
	tmplProps;
	tmplStr;
    blocks: (...args:any[])=>Promise<any>;   //XXX may be possible to use stronger type
    rootRenderFunc;

	constructor(src,env:SlimEnvironment,path) 
	{
		this.env = env;

		if (lib.isObject(src)) {
			switch (src.type) {
				case 'code':
					this.tmplProps = src.obj;
					this.rootRenderFunc = this.tmplProps.root;
					break;
				case 'string':
					this.tmplStr = src.obj;
					break;
				default:
					throw new Error(
						`Unexpected template object type ${src.type}; expected 'code', or 'string'`);
			}
		} else if (lib.isString(src)) 
			this.tmplStr = src;
		else 
			throw new Error('src must be a string or an object describing the source');

		this.path = path;
	}

//XXX may be abe to remove
	/* Is subtyped in the full Template */
	public async init(eagerCompile:boolean) { }

	async render(ctx, parentFrame=undefined):Promise<string>
	{
		if (typeof ctx === 'function') 
			ctx = {};
		else if (typeof parentFrame === 'function') 
			parentFrame = null;

		await this.compile();

		const context = new Context(ctx || {}, this.blocks, this.env);
		const frame = parentFrame ? parentFrame.push(true) : new Frame();
		frame.topLevel = true;

		return await this.rootRenderFunc(this.env,context,frame,globalRuntime);
	}

	async getExported(ctx, parentFrame) // eslint-disable-line consistent-return
	{ 
		if (typeof ctx === 'function') 
			ctx = {};

		if (typeof parentFrame === 'function') 
			parentFrame = null;

		// Catch compile errors for async rendering
		await this.compile();

		const frame = parentFrame ? parentFrame.push() : new Frame();
		frame.topLevel = true;

		// Run the rootRenderFunc to populate the context with exported vars
		const context = new Context(ctx || {}, this.blocks, this.env);
		await this.rootRenderFunc(this.env, context, frame, globalRuntime); 

		return context.getExported();
	}

	_getBlocks(props)
	{
		var blocks:any = {};

		lib.keys(props).forEach((k) => {
			if (k.slice(0, 2) === 'b_') 
				blocks[k.slice(2)] = props[k];
		});
		return blocks;
	}

	/* Is subtyped in the full Template */
	async compile() { }
}

