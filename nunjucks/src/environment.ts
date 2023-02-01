'use strict';

import asap from 'asap';
import waterfall from 'a-sync-waterfall';
import * as lib from './lib';
import compiler from './compiler';
//import filters from './filters';
const filters = require('./filters');
import type Loader from './loader';
import {FileSystemLoader, WebLoader, PrecompiledLoader} from './loaders';
import tests from './tests';
import globals from './globals';
import {Obj,Obj2, EmitterObj,EmitterObj2} from './object';
import globalRuntime,{handleError,Frame} from './runtime';
import expressApp from './express-app';

/**
 * A no-op template, for use with {% include ignore missing %}
 */
const noopTmplSrc = {
	type: 'code',
	obj: {
		root(env, context, frame, runtime, cb) {
			try {
				cb(null, '');
			} catch (e) {
				cb(handleError(e, null, null));
			}
		}
	}
};


//XXX use an emit mixin
class Environment extends EmitterObj2 
{
	globals;
	filters = {};
	tests = {};
	asyncFilters = [];
	extensions = {};
	extensionsList = [];
	opts;
//FIXME only working with 'declare' present. No idea why	
	public loaders;  //XXX public for testing only
//	public loaders: Loader[];  //XXX public for testing only


	constructor(loaders?:Loader|Loader[], opts?:any) 
	{
		super();

		// The dev flag determines the trace that'll be shown on errors.
		// If set to true, returns the full trace from the error point,
		// otherwise will return trace starting from Template.render
		// (the full trace from within nunjucks may confuse developers using
		//  the library)
		// defaults to false
		opts = this.opts = opts || {};
		this.opts.dev = !!opts.dev;

		// The autoescape flag sets global autoescaping. If true,
		// every string variable will be escaped by default.
		// If false, strings can be manually escaped using the `escape` filter.
		// defaults to true
		this.opts.autoescape = opts.autoescape != null ? opts.autoescape : true;

		// If true, this will make the system throw errors if trying
		// to output a null or undefined value
		this.opts.throwOnUndefined = !!opts.throwOnUndefined;
		this.opts.trimBlocks = !!opts.trimBlocks;
		this.opts.lstripBlocks = !!opts.lstripBlocks;

		this.loaders = [];

		if (!loaders) {
			// The filesystem loader is only available server-side
			if (FileSystemLoader) 
				this.loaders = [new FileSystemLoader('views')];
			else if (WebLoader) 
				this.loaders = [new WebLoader('/views')];
		} 
		else 
			this.loaders = lib.isArray(loaders) ? loaders : [loaders];

		// It's easy to use precompiled templates: just include them
		// before you configure nunjucks and this will automatically
		// pick it up and use it
		if (typeof window !== 'undefined' && window.nunjucksPrecompiled) 
			this.loaders.unshift(new PrecompiledLoader(window.nunjucksPrecompiled));

		this._initLoaders();

		this.globals = globals();
		this.filters = {};
		this.tests = {};
		this.asyncFilters = [];
		this.extensions = {};
		this.extensionsList = [];

		lib._entries(filters).forEach(([name, filter]) => this.addFilter(name, filter));
		lib._entries(tests).forEach(([name, test]) => this.addTest(name, test));
  	}

	_initLoaders() 
	{
		const me = this;

		this.loaders.forEach(loader => {
			// Caching and cache busting
			loader.cache = {};
			if (typeof loader.on === 'function') {
				loader.on('update', function(name, fullname) {
					loader.cache[name] = null;
//FIXME use a mixin to support emit?
					me.emit('update', name, fullname, loader);
				});
//XXX BB possibly just used for Chokidar
				loader.on('load', function(name, source) {
					me.emit('load', name, source, loader);
				});
			}
		});
	}

	invalidateCache() 
	{
		this.loaders.forEach((loader) => {
			loader.cache = {};
		});
	}

	addExtension(name, extension) 
	{
		extension.__name = name;
		this.extensions[name] = extension;
		this.extensionsList.push(extension);
		return this;
	}

	removeExtension(name) 
	{
		var extension = this.getExtension(name);
		if (!extension) 
			return;
//XXX  BB looks like a bug			
//		this.extensionsList = lib.without(this.extensionsList, extension);
		this.extensionsList = lib.without([extension]);
		delete this.extensions[name];
	}

	getExtension(name) 
	{
		return this.extensions[name];
	}

	hasExtension(name) 
	{
		return !!this.extensions[name];
	}

	addGlobal(name,value) 
	{
		this.globals[name] = value;
		return this;
	}

	getGlobal(name) 
	{
		if (typeof this.globals[name] === 'undefined') 
			throw new Error('global not found: ' + name);
		return this.globals[name];
	}

	addFilter(name, func, async=undefined) 
	{
		var wrapped = func;
		if (async) 
			this.asyncFilters.push(name);
		this.filters[name] = wrapped;
		return this;
	}

	getFilter(name) 
	{
		if (!this.filters[name]) 
			throw new Error('filter not found: ' + name);
		return this.filters[name];
	}

	addTest(name, func) 
	{
		this.tests[name] = func;
		return this;
	}

	getTest(name) 
	{
		if (!this.tests[name]) 
			throw new Error('test not found: ' + name);
		return this.tests[name];
	}

	resolveTemplate(loader, parentName, filename) 
	{
		var isRelative = (loader.isRelative && parentName) ? loader.isRelative(filename) : false;
		return (isRelative && loader.resolve) ? loader.resolve(parentName, filename) : filename;
	}

	async getTemplate(name, eagerCompile=undefined, parentName=undefined, ignoreMissing=undefined)
	{
		var that = this;
		var tmpl = null;

		// this fixes autoescape for templates referenced in symbols
		if (name && name.raw) 
			name = name.raw;

		if (lib.isFunction(parentName)) {
			parentName = null;
			eagerCompile = eagerCompile || false;
		}

		if (lib.isFunction(eagerCompile)) 
			eagerCompile = false;

		if (name instanceof Template) 
			return name;

		if (typeof name !== 'string') 
			throw new Error('template names must be a string: ' + name);

//XXX can we do with a single loader? (nb could be a ChainLoader if necessary)

		for (let i = 0; i < this.loaders.length; i++) {
			const loader = this.loaders[i];
			tmpl = loader.cache[this.resolveTemplate(loader, parentName, name)];
			if (tmpl!=null) 
				return tmpl;

			const resolvedName = that.resolveTemplate(loader, parentName, name);
			const info = await loader.getSource(resolvedName);

			if (!info) 
				return new Template(noopTmplSrc, this, '', eagerCompile);
			else {
				tmpl = new Template(info.src, this, info.path, eagerCompile);
				if (!info.noCache) 
					info.loader.cache[<string>name] = tmpl;
				return tmpl;
			}
		}

		if (ignoreMissing) 
			return null;

		throw new Error('template not found: ' + name);
	}

	express(app) 
	{
		return expressApp(this, app);
	}

	async render(name, ctx):Promise<string> 
	{
		if (lib.isFunction(ctx)) 
			ctx = null;

		const tmpl = await this.getTemplate(name);
		return await tmpl.render(ctx);
	}

	async renderString(src, ctx, opts):Promise<string>
	{
		if (lib.isFunction(opts)) 
			opts = {};
		opts = opts || {};

		const tmpl = new Template(src, this, opts.path);
		return await tmpl.render(ctx);
	}

	waterfall(tasks, callback, forceAsync) 
	{
		return waterfall(tasks, callback, forceAsync);
	}
}


//TODO split into separate files

class Context extends Obj2
{
	env;
	ctx;
	blocks;
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

	getSuper(env, name, block, frame, runtime, cb) 
	{
		var idx = lib.indexOf(this.blocks[name] || [], block);
		var blk = this.blocks[name][idx + 1];
		var context = this;

		if (idx === -1 || !blk) 
			throw new Error('no super block available for "' + name + '"');

		blk(env, context, frame, runtime, cb);
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


class Template extends Obj2
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
		if (typeof ctx === 'function') 
			ctx = {};
		else if (typeof parentFrame === 'function') 
			parentFrame = null;

		// Catch compile errors for async rendering
		try {
			this.compile();
		} 
		catch (e) {
			throw lib._prettifyError(this.path, this.env.opts.dev, e);
		}

		const context = new Context(ctx || {}, this.blocks, this.env);
		const frame = parentFrame ? parentFrame.push(true) : new Frame();
		frame.topLevel = true;
		let syncResult = null;

		this.rootRenderFunc(this.env, context, frame, globalRuntime, (err, res) => {
			if (err) 
				throw lib._prettifyError(this.path, this.env.opts.dev, err);
			syncResult = res;
		});
		return syncResult;
	}

	getExported(ctx, parentFrame, cb) // eslint-disable-line consistent-return
	{ 
		if (typeof ctx === 'function') {
			cb = ctx;
			ctx = {};
		}

		if (typeof parentFrame === 'function') {
			cb = parentFrame;
			parentFrame = null;
		}

		// Catch compile errors for async rendering
		try {
			this.compile();
		} catch (e) {
			if (cb) 
				return cb(e);
			else 
				throw e;
		}

		const frame = parentFrame ? parentFrame.push() : new Frame();
		frame.topLevel = true;

		// Run the rootRenderFunc to populate the context with exported vars
		const context = new Context(ctx || {}, this.blocks, this.env);
		this.rootRenderFunc(this.env, context, frame, globalRuntime, (err) => {
			if (err) 
				cb(err, null);
			else 
				cb(null, context.getExported());
		});
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
			this.env.asyncFilters,
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

export {Environment,Template};
