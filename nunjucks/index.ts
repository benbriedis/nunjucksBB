'use strict';

import lib from './src/lib';
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

	let TemplateLoader;
	if (loaders.FileSystemLoader) 
		TemplateLoader = new loaders.FileSystemLoader(templatesPath, {
			watch: opts.watch,
			noCache: opts.noCache
		});
	else if (loaders.WebLoader) 
		TemplateLoader = new loaders.WebLoader(templatesPath, {
			useCache: opts.web && opts.web.useCache,
			async: opts.web && opts.web.async
		});

	e = new Environment(TemplateLoader, opts);

	if (opts && opts.express) 
		e.express(opts.express);

	return e;
}

export const FileSystemLoader = loaders.FileSystemLoader;
export const NodeResolveLoader = loaders.NodeResolveLoader;
export const PrecompiledLoader = loaders.PrecompiledLoader;
export const WebLoader = loaders.WebLoader;

export {Environment,Template,Loader};
export {compiler,parser,lexer,runtime,lib,nodes,installJinjaCompat,configure};

export function reset() 
{
	e = undefined;
}

export function compile(src, env, path, eagerCompile) 
{
	if (!e) 
		configure();
	return new Template(src, env, path, eagerCompile);
}

export function render(name, ctx, cb) 
{
	if (!e) 
		configure();
	return e.render(name, ctx, cb);
}

//XXX in time use this to replace old render()
export async function asyncRender(name,ctx) 
{
	if (!e) 
		configure();
	return await e.asyncRender(name, ctx);
}


export function renderString(src, ctx, cb) 
{
	if (!e) 
		configure();
	return e.renderString(src, ctx, cb);
}

//FIXME precompile can be undefined in which case these should not be exported
export const precompile = precomp.precompile;
export const precompileString = precomp.precompileString;

//export default e;  /* ie default "nunjucks" */

/*
module.exports = {
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
  nodes: nodes,
  installJinjaCompat: installJinjaCompat,
  configure: configure,
  reset() {
    e = undefined;
  },
  compile(src, env, path, eagerCompile) {
    if (!e) {
      configure();
    }
    return new Template(src, env, path, eagerCompile);
  },
  render(name, ctx, cb) {
    if (!e) {
      configure();
    }

    return e.render(name, ctx, cb);
  },
  renderString(src, ctx, cb) {
    if (!e) {
      configure();
    }

    return e.renderString(src, ctx, cb);
  },
  precompile: (precompile) ? precompile.precompile : undefined,
  precompileString: (precompile) ? precompile.precompileString : undefined,
};
*/
