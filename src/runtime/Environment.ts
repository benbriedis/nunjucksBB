import Template from './Template';
import SlimEnvironment from './SlimEnvironment';
import fs from 'fs';
import path from 'path';
import { _prettifyError } from '../runtime/lib';
import compiler from '../compiler/Compiler';
import {precompileGlobal} from '../compiler/precompile-global';

export {default as FileSystemLoader} from '../loaders/FileSystemLoader';
export {default as WebLoader} from '../loaders/WebLoader';

export default class Environment extends SlimEnvironment
{
	protected createTemplate(src,path:string)
	{
		return new Template(src,this,path);
	}

	precompileString(str,opts) 
	{
		opts = opts || {};
		opts.isString = true;
		const wrapper = opts.wrapper || precompileGlobal;

		if (!opts.name) 
			throw new Error('the "name" option is required when compiling a string');

		return wrapper([this._precompile(str,opts.name)], opts);
	}

	precompile(input, opts) 
	{
		// The following options are available:
		//
		// * name: name of the template (auto-generated when compiling a directory)
		// * isString: input is a string, not a file path
		// * asFunction: generate a callable function
		// * force: keep compiling on error
		// * env: the Environment to use (gets extensions and async filters from it)
		// * include: which file/folders to include (folders are auto-included, files are auto-excluded)
		// * exclude: which file/folders to exclude (folders are auto-included, files are auto-excluded)
		// * wrapper: function(templates, opts) {...}
		//       Customize the output format to store the compiled template.
		//       By default, templates are stored in a global variable used by the runtime.
		//       A custom loader will be necessary to load your custom wrapper.

		opts = opts || {};
		const wrapper = opts.wrapper || precompileGlobal;

		if (opts.isString) 
			return this.precompileString(input, opts);

		const pathStats = fs.existsSync(input) && fs.statSync(input);
		const precompiled = [];
		const templates = [];

		function addTemplates(dir) {
			fs.readdirSync(dir).forEach((file) => {
				const filepath = path.join(dir, file);
				let subpath = filepath.substr(path.join(input, '/').length);
				const stat = fs.statSync(filepath);

				if (stat && stat.isDirectory()) {
					subpath += '/';
					if (!match(subpath, opts.exclude)) 
						addTemplates(filepath);
				} else if (match(subpath, opts.include)) 
					templates.push(filepath);
			});
		}

		if (pathStats.isFile()) 
			precompiled.push(this._precompile(fs.readFileSync(input,'utf-8'),opts.name || input));
		else if (pathStats.isDirectory()) {
			addTemplates(input);

			for (let i = 0; i < templates.length; i++) {
				const name = templates[i].replace(path.join(input, '/'), '');

				try {
					precompiled.push(this._precompile(fs.readFileSync(templates[i],'utf-8'),name));
				} catch (e) {
					if (opts.force) 
						// Don't stop generating the output if we're
						// forcing compilation.
						console.error(e); // eslint-disable-line no-console
					else 
						throw e;
				}
			}
		}

		return wrapper(precompiled, opts);
	}

	private _precompile(str, name) 
	{
		name = name.replace(/\\/g, '/');
		const template = compiler.compile(str,this.extensionsList,name,this.opts);
		return {name:name,template:template};
	}
}


function match(filename,patterns) 
{
	if (!Array.isArray(patterns)) 
		return false;
	return patterns.some(pattern => filename.match(pattern));
}

