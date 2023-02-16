import fs,{access} from 'fs/promises';
import path from 'path';
import Loader, {LoaderSource} from './Loader';

export default class FileSystemLoader extends Loader 
{
	pathsToNames;
	noCache;
	searchPaths;

	constructor(searchPaths, opts=undefined) 
	{
		super();
		if (typeof opts === 'boolean') 
			console.log(
				'[nunjucks] Warning: you passed a boolean as the second ' +
				'argument to FileSystemLoader, but it now takes an options ' +
				'object. See http://mozilla.github.io/nunjucks/api.html#filesystemloader'
			);

		opts = opts || {};
		this.pathsToNames = {};
		this.noCache = !!opts.noCache;

//TODO just accept array
		if (searchPaths) {
			searchPaths = Array.isArray(searchPaths) ? searchPaths : [searchPaths];
			// For windows, convert to forward slashes
			this.searchPaths = searchPaths.map(path.normalize);
		} else 
			this.searchPaths = ['.'];
	}

	createPath(from:string,to:string):string
	{
		return path.resolve(path.dirname(from), to);
	}

	async getSource(name):Promise<LoaderSource>
	{
		var fullpath = null;
		var paths = this.searchPaths;

		for (let i = 0; i < paths.length; i++) {
			const basePath = path.resolve(paths[i]);
			const p = path.resolve(paths[i], name);

			// Only allow the current directory and anything
			// underneath it to be searched
			if (p.indexOf(basePath) === 0 && await fileExists(p)) {
				fullpath = p;
				break;
			}
		}

		if (!fullpath) 
			return null;

		this.pathsToNames[fullpath] = name;

		const source = {
			src: await fs.readFile(fullpath, 'utf-8'),
			path: fullpath,
			noCache: this.noCache
		};

//XXX consider trimming any final \n here, or having a loader option to do so. Linux almost always adds a \n at the end.

		this.emit('load', name, source);

		return source;
	}
}

async function fileExists(path:string): Promise<boolean>
{
	try {
		await access(path);
		return true;
	}
	catch(err) {
		return false;
	}
}

