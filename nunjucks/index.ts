'use strict';

import * as lib from './src/lib';
import {Environment, Template} from './src/environment';
import Loader from './src/loader';
import loaders from './src/loaders';
import precomp from './src/precompile';
import compiler from './src/compiler';
import parser from './src/parser';
import lexer from './src/lexer';
import runtime from './src/runtime';
import nodes from './src/nodes';
import installJinjaCompat from './src/jinja-compat';

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
	if (loaders.FileSystemLoader) 
		templateLoader = new loaders.FileSystemLoader(templatesPath, {
			watch: opts.watch,
			noCache: opts.noCache
		});
	else if (loaders.WebLoader) 
		templateLoader = new loaders.WebLoader(templatesPath, {
			useCache: opts.web && opts.web.useCache,
			async: opts.web && opts.web.async
		});

	e = new Environment(templateLoader, opts);

	if (opts && opts.express) 
		e.express(opts.express);

	return e;
}

function reset() 
{
	e = undefined;
}

function compile(src, env, path, eagerCompile) 
{
	if (!e) 
		configure();
	return new Template(src, env, path, eagerCompile);
}

function render(name, ctx, cb=undefined) 
{
	if (!e) 
		configure();
	return e.render(name, ctx, cb);
}

//XXX in time use this to replace old render()
async function asyncRender(name,ctx) 
{
	if (!e) 
		configure();
	return await e.asyncRender(name, ctx);
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
	FileSystemLoader: loaders.FileSystemLoader,
	NodeResolveLoader: loaders.NodeResolveLoader,
	PrecompiledLoader: loaders.PrecompiledLoader,
	WebLoader: loaders.WebLoader,
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
	precompile: (precomp) ? precomp.precompile : undefined,
	precompileString: (precomp) ? precomp.precompileString : undefined,
};

