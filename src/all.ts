import Environment from './runtime/Environment';
import * as lib from './runtime/lib';

//XXX Probably shouldn't be exporting all of these

export {default as compiler} from './compiler/Compiler';
export {default as parser} from './parser/Parser';
export * as lexer from './parser/lexer';
export {default as nodes} from './parser/nodes';
export {precompile,precompileString} from './compiler/precompile';
export {default as installJinjaCompat} from './jinja-compat';
export * as runtime from './runtime/runtime';
export {default as Loader,LoaderSource} from './loaders/Loader';
export {default as FileSystemLoader} from './loaders/FileSystemLoader';
export {default as PrecompiledLoader} from './loaders/PrecompiledLoader';
export {default as WebLoader} from './loaders/WebLoader';
export {default as Template} from './runtime/Template';
export {default as Environment} from './runtime/Environment';


export function configure(templatesPath=undefined, opts=undefined) 
{
	opts = opts || {};
	if (lib.isObject(templatesPath)) {
		opts = templatesPath;
		templatesPath = null;
	}

	let templateLoader;

/*	FIXME
	if (Loaders.FileSystemLoader) 
		templateLoader = new Loaders.FileSystemLoader(templatesPath, {
			noCache: opts.noCache
		});
	else if (Loaders.WebLoader) 
		templateLoader = new Loaders.WebLoader(templatesPath, {
			useCache: opts.web && opts.web.useCache,
			async: opts.web && opts.web.async
		});
*/		

	return new Environment(templateLoader, opts);
}

/*
export async function compile(src,env,path,eagerCompile) 
{
	if (!e) 
		configure();
	const template = new Template(src,env,path);
	await template.init(eagerCompile);
	return template;
}
*/

