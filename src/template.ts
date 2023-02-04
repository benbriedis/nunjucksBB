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

	constructor(src, env, path, eagerCompile=undefined) 
	{
		super();
console.log('environment Template() path:',path);
console.log('environment Template() src:',src);

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

		if (eagerCompile) 
			try {
				this._compile();
			} catch (err) {
				throw lib._prettifyError(this.path, this.env.opts.dev, err);
			}
		else 
			this.compiled = false;
	}

	async render(ctx, parentFrame=undefined):Promise<string>
	{
console.log('environment render() ctx:',ctx);

		if (typeof ctx === 'function') 
			ctx = {};
		else if (typeof parentFrame === 'function') 
			parentFrame = null;

		// Catch compile errors for async rendering
		try {
//TODO embed the compile() call in here - less confusing		
			this.compile();
		} 
		catch (e) {
			throw lib._prettifyError(this.path, this.env.opts.dev, e);
		}

		const context = new Context(ctx || {}, this.blocks, this.env);
		const frame = parentFrame ? parentFrame.push(true) : new Frame();
		frame.topLevel = true;
		let syncResult = null;

console.log('environment render() this.env:',this.env);
console.log('environment render() context:',context);
console.log('environment render() frame:',frame);
console.log('environment render() globalRuntime:',globalRuntime);

		await this.rootRenderFunc(this.env, context, frame, globalRuntime, (err, res) => {
console.log('environment render() - rootRenderFunc()  res:',res);
console.log('environment render() - rootRenderFunc()  err:',err);
			if (err) 
				throw lib._prettifyError(this.path, this.env.opts.dev, err);
			syncResult = res;
		});
console.log('environment render() syncResult:',syncResult);
		return syncResult;
	}

	async getExported(ctx, parentFrame) // eslint-disable-line consistent-return
	{ 
		if (typeof ctx === 'function') 
			ctx = {};

		if (typeof parentFrame === 'function') 
			parentFrame = null;

		// Catch compile errors for async rendering
		this.compile();

		const frame = parentFrame ? parentFrame.push() : new Frame();
		frame.topLevel = true;

		// Run the rootRenderFunc to populate the context with exported vars
		const context = new Context(ctx || {}, this.blocks, this.env);
		await this.rootRenderFunc(this.env, context, frame, globalRuntime, (err) => { }); //XXX callback?
//XXX return value?		

//XXX return this 		
//		context.getExported();
	}

	compile() 
	{
		if (!this.compiled) 
			this._compile();
	}

	_compile() 
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

			const func = new Function(source); // eslint-disable-line no-new-func
			props = func();
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

