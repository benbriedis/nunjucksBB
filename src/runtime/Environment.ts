import Globals from './globals';
import Filters from './Filters';
import * as tests from './tests';
import type Loader from '../loaders/Loader';
import * as lib from './lib';
import Template from './Template';

export {default as FileSystemLoader} from '../loaders/FileSystemLoader';
export {default as PrecompiledLoader} from '../loaders/PrecompiledLoader';
export {default as WebLoader} from '../loaders/WebLoader';

/* A no-op template, for use with {% include ignore missing %} */
const noopTmplSrc = {
	type: 'code',
	obj: {
		root(env, context, frame, runtime) { return ''; }
	}
};


//XXX use an emit mixin
export default class Environment 
{
	globals;
//	filters: AsyncFunc[] = <any>null;
	filters: Filters;
	tests = {};
	extensions = {};
	extensionsList = [];
	opts;
	loader;  


	constructor(loader:Loader, opts:any={}) 
	{
		this.loader = loader;
		this.opts = opts;

		// The dev flag determines the trace that'll be shown on errors.
		// If set to true, returns the full trace from the error point,
		// otherwise will return trace starting from Template.render
		// (the full trace from within nunjucks may confuse developers using
		//  the library)
		// defaults to false
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

//XXX YUCK: names are not templates. May relate to the broken unit test...
		if (name instanceof Template)  
			return name;

		if (typeof name !== 'string') 
			throw new Error('template names must be a string: ' + name);

		const resolvedName = this.resolveTemplate(this.loader, parentName, name);

		const tmpl = this.loader.cache[resolvedName];
		if (tmpl!=null) return tmpl;

		const info = await this.loader.getSource(resolvedName);
		if (info != null) {
			const template = new Template(info.src, this, info.path);
			await template.init(eagerCompile);
			if (!info.noCache) 
				this.loader.cache[resolvedName] = template;
			return template;
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

