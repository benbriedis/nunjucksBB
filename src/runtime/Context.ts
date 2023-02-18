import * as lib from './lib';
import SlimEnvironment from './SlimEnvironment';
import {Blocks} from './SlimTemplate';
import Frame from './Frame';

export type Block = (env:SlimEnvironment,context:Context,frame:Frame,runtime)=>Promise<any>; 
export type BlockLists = {[name:string]:Block[]};

/*
	Context is used by the compiled code - e.g. calls are make to
	setVariable(), getVariables(), addExport(), getBlock(), getSuper()
 */
export default class Context
{
	env:SlimEnvironment;
	ctx:Context;
	blocks:BlockLists = {}; 
	exported: string[] = [];

	constructor(ctx:Context,blocks:Blocks,env:SlimEnvironment) 
	{
		// Has to be tied to an environment so we can tap into its globals.
		this.env = env;

		// Make a duplicate of ctx
		this.ctx = Object.assign({},ctx);

		for (const [name,block] of Object.entries(blocks))
			this.addBlock(name,block);
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

	setVariable(name:string, val):void
	{
		this.ctx[name] = val;
	}

	getVariables():Context 
	{
		return this.ctx;
	}

	//XXX note this is mutable. Can we remove the chaining?
	addBlock(name:string, block:Block):Context 
	{
		this.blocks[name] = this.blocks[name] || [];
		this.blocks[name].push(block);
		return this;
	}

	getBlock(name:string):Block
	{
		if (!this.blocks[name]) 
			throw new Error('unknown block "' + name + '"');

		return this.blocks[name][0];
	}

	async getSuper(env:SlimEnvironment,name:string,block:Block,frame:Frame,runtime):Promise<Block>
	{
		var idx = lib.indexOf(this.blocks[name] || [], block);
		var blk = this.blocks[name][idx + 1];

		if (idx === -1 || !blk) 
			throw new Error('no super block available for "' + name + '"');

		return await blk(env,this,frame,runtime);
	}

	addExport(name:string):void 
	{
		this.exported.push(name);
	}

	getExported():Blocks 
	{
		var exported:Blocks = {};
		for (const name of this.exported)
			exported[name] = this.ctx[name];
		return exported;
	}
}
