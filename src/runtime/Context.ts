import * as lib from './lib';
import Environment from './Environment';
import Frame from './Frame';

/*
	Context is used by the compiled code - e.g. calls are make to
	setVariable(), getVariables(), addExport(), getBlock(), getSuper()
 */
export default class Context
{
	env:Environment;
	ctx:Context;
	blocks;     //XXX currently these are async functions
	exported;

	constructor(ctx:Context, blocks, env:Environment) 
	{
//		super();

		// Has to be tied to an environment so we can tap into its globals.
		this.env = env;

		// Make a duplicate of ctx
		this.ctx = Object.assign({},ctx);

		this.blocks = {};
		this.exported = [];

		lib.keys(blocks).forEach(name => {
			this.addBlock(name, blocks[name]);
		});
	}

	lookup(name:string) 
	{
		// This is one of the most called functions, so optimize for
		// the typical case where the name isn't in the globals
		if (name in this.env.globals && !(name in this.ctx))
			return this.env.globals[name];
		else 
			return this.ctx[name];
	}

	setVariable(name:string, val) 
	{
		this.ctx[name] = val;
	}

	getVariables() 
	{
		return this.ctx;
	}

	addBlock(name:string, block) 
	{
		this.blocks[name] = this.blocks[name] || [];
		this.blocks[name].push(block);
		return this;
	}

	getBlock(name:string) 
	{
		if (!this.blocks[name]) 
			throw new Error('unknown block "' + name + '"');

		return this.blocks[name][0];
	}

	async getSuper(env:Environment,name:string,block,frame:Frame,runtime) 
	{
		var idx = lib.indexOf(this.blocks[name] || [], block);
		var blk = this.blocks[name][idx + 1];

		if (idx === -1 || !blk) 
			throw new Error('no super block available for "' + name + '"');

		return await blk(env,this,frame,runtime);
	}

	addExport(name:string) 
	{
		this.exported.push(name);
	}

	getExported() 
	{
		var exported = {};
		this.exported.forEach(name => {
			exported[name] = this.ctx[name];
		});
		return exported;
	}
}
