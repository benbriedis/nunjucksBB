'use strict';

import * as lib from './lib';
import Environment from './environment';
import Template from './template';
import Loader from './loader';
import {Loaders} from './loaders';
import {precompile,precompileString} from './precompile';
import compiler from './compiler';
import parser from './parser';
import lexer from './lexer';
import * as runtime from './runtime';
import nodes from './nodes';
import installJinjaCompat from './jinja-compat';

// A single instance of an environment, since this is so commonly used
let e;

function configure(templatesPath=undefined, opts=undefined) 
{
	opts = opts || {};
	if (lib.isObject(templatesPath)) {
		opts = templatesPath;
		templatesPath = null;
	}

	let templateLoader;
	if (Loaders.FileSystemLoader) 
		templateLoader = new Loaders.FileSystemLoader(templatesPath, {
			watch: opts.watch,
			noCache: opts.noCache
		});
	else if (Loaders.WebLoader) 
		templateLoader = new Loaders.WebLoader(templatesPath, {
			useCache: opts.web && opts.web.useCache,
			async: opts.web && opts.web.async
		});

	return new Environment(templateLoader, opts);
}

function reset() 
{
	e = undefined;
}

async function compile(src, env, path, eagerCompile) 
{
	if (!e) 
		configure();
	const template = new Template(src,env,path);
	await template.init(eagerCompile);
	return template;
}

async function render(name, ctx):Promise<string>
{
	if (!e) 
		configure();
	return await e.render(name, ctx);
}

function renderString(src, ctx, cb) 
{
	if (!e) 
		configure();
	return e.renderString(src, ctx, cb);
}




//XXX BB for the moment Ive had to add lots of exports to things that dont need to be exported
//       separately to keep TS happy, in nodes, compiler, parser, lexer and runtime
//       MAYBE MOVE OVER TO USING <any> as for nodes below
export default {
	Environment: Environment,
	Template: Template,
	Loader: Loader,
	FileSystemLoader: Loaders.FileSystemLoader,
	NodeResolveLoader: Loaders.NodeResolveLoader,
	PrecompiledLoader: Loaders.PrecompiledLoader,
	WebLoader: Loaders.WebLoader,
	compiler: compiler,
	parser: parser,
	lexer: lexer,
	runtime: runtime,
	lib: lib,
	nodes: <any>nodes,
	installJinjaCompat: installJinjaCompat,
	configure: configure,
	reset: reset,
	compile:compile,
	render:render,
	renderString:renderString,
	precompile: precompile,
	precompileString: precompileString 
};

