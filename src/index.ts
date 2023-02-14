
import Template from './template';
import * as Loaders from './loaders';
import * as lib from './lib';
import Environment from './environment';


export {default as Environment} from './environment';
export {default as Template} from './template';
export {default as Loader,LoaderSource} from './loader';
export {default as compiler} from './compiler';
export {default as parser} from './parser';
export {default as lexer} from './lexer';
export {default as nodes} from './nodes';
export {precompile,precompileString} from './precompile';
export {default as installJinjaCompat} from './jinja-compat';
export * as lib from './lib';
export * as runtime from './runtime';
export {default as FileSystemLoader} from './FileSystemLoader';
export {default as PrecompiledLoader} from './PrecompiledLoader';
export {default as WebLoader} from './WebLoader';


//TODO move everything that isn't an export out of index.ts


// A single instance of an environment, since this is so commonly used
let e;

export function configure(templatesPath=undefined, opts=undefined) 
{
	opts = opts || {};
	if (lib.isObject(templatesPath)) {
		opts = templatesPath;
		templatesPath = null;
	}

	let templateLoader;
	if (Loaders.FileSystemLoader) 
		templateLoader = new Loaders.FileSystemLoader(templatesPath, {
			noCache: opts.noCache
		});
	else if (Loaders.WebLoader) 
		templateLoader = new Loaders.WebLoader(templatesPath, {
			useCache: opts.web && opts.web.useCache,
			async: opts.web && opts.web.async
		});

	e = new Environment(templateLoader, opts);
	return e;
}

export function reset() 
{
	e = undefined;
}

export async function compile(src,env,path,eagerCompile) 
{
	if (!e) 
		configure();
	const template = new Template(src,env,path);
	await template.init(eagerCompile);
	return template;
}

export async function render(name,ctx):Promise<string>
{
	if (!e) 
		configure();
	return await e.render(name, ctx);
}

export async function renderString(src,ctx) 
{
	if (!e) 
		configure();
	return await e.renderString(src,ctx);
}

