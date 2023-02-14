import * as lib from './lib';
import {Obj} from './object';
import Environment from './environment';

export default class Context extends Obj
{
	env;
	ctx;
	blocks;     //XXX currently these are async functions
	exported;

	constructor(ctx, blocks, env) 
	{
		super();

		// Has to be tied to an environment so we can tap into its globals.
		this.env = env || new Environment();

		// Make a duplicate of ctx
		this.ctx = lib.extend({}, ctx);

		this.blocks = {};
		this.exported = [];

		lib.keys(blocks).forEach(name => {
			this.addBlock(name, blocks[name]);
		});
	}

	lookup(name) 
	{
		// This is one of the most called functions, so optimize for
		// the typical case where the name isn't in the globals
		if (name in this.env.globals && !(name in this.ctx))
			return this.env.globals[name];
		else 
			return this.ctx[name];
	}

	setVariable(name, val) 
	{
		this.ctx[name] = val;
	}

	getVariables() 
	{
		return this.ctx;
	}

	addBlock(name, block) 
	{
		this.blocks[name] = this.blocks[name] || [];
		this.blocks[name].push(block);
		return this;
	}

	getBlock(name) 
	{
		if (!this.blocks[name]) 
			throw new Error('unknown block "' + name + '"');

		return this.blocks[name][0];
	}

	async getSuper(env,name,block,frame,runtime) 
	{
		var idx = lib.indexOf(this.blocks[name] || [], block);
		var blk = this.blocks[name][idx + 1];
		var context = this;

		if (idx === -1 || !blk) 
			throw new Error('no super block available for "' + name + '"');

		return await blk(env,this,frame,runtime);
	}

	addExport(name) 
	{
		this.exported.push(name);
	}

	getExported() 
	{
		var exported = {};
		this.exported.forEach((name) => {
			exported[name] = this.ctx[name];
		});
		return exported;
	}
}
