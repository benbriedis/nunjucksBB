import * as lib from './lib';
import compiler from './compiler';
import {Obj2} from './object';
import globalRuntime,{Frame} from './runtime';
import Environment from './environment';
import Context from './context';

export default class Template extends Obj2
{
	env;
	path;
	tmplProps;
	tmplStr;
	compiled;
    blocks;
    rootRenderFunc;

	constructor(src, env, path) 
	{
		super();

		this.env = env || new Environment();

		if (lib.isObject(src)) {
			switch (src.type) {
				case 'code':
					this.tmplProps = src.obj;
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

	public async init(eagerCompile:boolean)
	{
		if (eagerCompile) 
			try {
				await this._compile();
			} catch (err) {
				throw lib._prettifyError(this.path, this.env.opts.dev, err);
			}
		else 
			this.compiled = false;
	}

	async render(ctx, parentFrame=undefined):Promise<string>
	{
		if (typeof ctx === 'function') 
			ctx = {};
		else if (typeof parentFrame === 'function') 
			parentFrame = null;

		// Catch compile errors for async rendering
		try {
//TODO embed the compile() call in here - less confusing		
			await this.compile();
		} 
		catch (e) {
			throw lib._prettifyError(this.path, this.env.opts.dev, e);
		}

		const context = new Context(ctx || {}, this.blocks, this.env);
		const frame = parentFrame ? parentFrame.push(true) : new Frame();
		frame.topLevel = true;
		let syncResult = null;

		await this.rootRenderFunc(this.env, context, frame, globalRuntime, (err, res) => {
			if (err) 
{			
console.log('environment render() - rootRenderFunc()  err:',err);
				throw lib._prettifyError(this.path, this.env.opts.dev, err);
}				
			syncResult = res;
		});
		return syncResult;
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
		await this.rootRenderFunc(this.env, context, frame, globalRuntime, (err) => { }); //XXX callback?
//XXX return value?		

//XXX return this 		
//		context.getExported();
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
			const source = compiler.compile(this.tmplStr,
//			this.env.asyncFilters,   XXX might we need to pass in regular filters?
			this.env.extensionsList,
			this.path,
			this.env.opts);

//XXX Can the source be a wrapped function???   async function root(env, context, frame, runtime, cb) {...}			
//XXX Can the AsyncFunction source be a wrapped function???   async function root(env, context, frame, runtime, cb) {...}			
//XXX Do we need AsyncFunction?

//console.log('template._compile()  source:',source)
			const func = new Function(source); // eslint-disable-line no-new-func
//			const AsyncFunction = async function () {}.constructor;
//			const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

//			const func = new AsyncFunction(source); // eslint-disable-line no-new-func
			props = await func();
		}

		this.blocks = this._getBlocks(props);
		this.rootRenderFunc = props.root;
		this.compiled = true;
	}

	_getBlocks(props) 
	{
		var blocks = {};

		lib.keys(props).forEach((k) => {
			if (k.slice(0, 2) === 'b_') 
				blocks[k.slice(2)] = props[k];
		});
		return blocks;
	}
}

