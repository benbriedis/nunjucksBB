import * as lib from './lib';
import type Loader from './loader';
import * as Loaders from './loaders';
import tests from './tests';
import Globals from './globals';
import Filters from './Filters';
import {EmitterObj} from './object';
import Template from './Template';

/* A no-op template, for use with {% include ignore missing %} */
const noopTmplSrc = {
	type: 'code',
	obj: {
		root(env, context, frame, runtime) { return ''; }
	}
};


//XXX use an emit mixin
export default class Environment extends EmitterObj 
{
	globals;
//	filters: AsyncFunc[] = <any>null;
	filters: Filters;
	tests = {};
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
			if (Loaders.FileSystemLoader) 
				this.loaders = [new Loaders.FileSystemLoader('views')];
			else if (Loaders.WebLoader) 
				this.loaders = [new Loaders.WebLoader('/views')];
		} 
		else 
			this.loaders = lib.isArray(loaders) ? loaders : [loaders];

		// It's easy to use precompiled templates: just include them
		// before you configure nunjucks and this will automatically
		// pick it up and use it
		if (typeof window !== 'undefined' && window.nunjucksPrecompiled) 
			this.loaders.unshift(new Loaders.PrecompiledLoader(window.nunjucksPrecompiled));

		this._initLoaders();

//TODO use new on all of these
		this.globals = new Globals();
//TODO ensure all filters and globals are async		
		this.filters = new Filters();
//		this.filters = <any>Object.assign({},Filters);
		this.tests = {};
		this.extensions = {};
		this.extensionsList = [];

//XXX is this necessary? Perhaps globals need this treatment too. Use Object.assign()?
//XXX only want public functions to be copied
		/* Shallow copy filters and tests into a new objects */
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

	addFilter(name, func) 
	{
		this.filters[name] = func;
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

	resolveTemplate(loader:Loader, parentName, filename) 
	{
		var isRelative = (loader.isRelative && parentName) ? loader.isRelative(filename) : false;
		return isRelative ? loader.createPath(parentName, filename) : filename;
	}

	async getTemplate(name, eagerCompile=undefined, parentName=undefined, ignoreMissing=undefined)
	{
		var tmpl = null;

		// this fixes autoescape for templates referenced in symbols
//XXX should be done in caller
		if (name && name.raw) 
			name = name.raw;

		if (lib.isFunction(parentName)) {
			parentName = null;
			eagerCompile = eagerCompile || false;
		}

		if (lib.isFunction(eagerCompile)) 
			eagerCompile = false;

//XXX YUCK: names are not templates
		if (name instanceof Template)  
			return name;

		if (typeof name !== 'string') 
			throw new Error('template names must be a string: ' + name);

//XXX can we do with a single loader? (nb could be a ChainLoader if necessary)

		for (let i = 0; i < this.loaders.length; i++) {
			const loader = this.loaders[i];
			const resolvedName = this.resolveTemplate(loader, parentName, name);

			tmpl = loader.cache[resolvedName];
			if (tmpl!=null) 
				return tmpl;

			const info = await loader.getSource(resolvedName);

			if (info != null) {
				const template = new Template(info.src, this, info.path);
				await template.init(eagerCompile);
				if (!info.noCache) 
					loader.cache[resolvedName] = template;
				return template;
			}
		}

		if (ignoreMissing) {
			const template = new Template(noopTmplSrc, this, '');
			await template.init(eagerCompile);
			return template;
		}

		throw new Error('template not found: ' + name);
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
}

