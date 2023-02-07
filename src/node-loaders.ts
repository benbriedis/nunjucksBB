/* eslint-disable no-console */

import fs,{access} from 'fs/promises';
import path from 'path';
import Loader, {LoaderSource} from './loader';
export {PrecompiledLoader} from './precompiled-loader';
let chokidar;

export class FileSystemLoader extends Loader 
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

//FIXME remove watch & chokidar
		if (opts.watch) {
			// Watch all the templates in the paths and fire an event when
			// they change
			try {
				chokidar = require('chokidar'); // eslint-disable-line global-require
			} catch (e) {
				throw new Error('watch requires chokidar to be installed');
			}
			const paths = this.searchPaths.filter(fileExists);
			const watcher = chokidar.watch(paths);
			watcher.on('all', function (event, fullname) {
				fullname = path.resolve(fullname);
				if (event === 'change' && fullname in this.pathsToNames) 
					this.emit('update', this.pathsToNames[fullname], fullname);
			});
			watcher.on('error', (error) => {
				console.log('Watcher error: ' + error);
			});
		}
	}

	async getSource(name):Promise<LoaderSource>
	{
console.log('node-loaders.js getSource()-1  name:',name);

		var fullpath = null;
		var paths = this.searchPaths;
console.log('node-loaders.js getSource()-1Z  paths:',paths);

		for (let i = 0; i < paths.length; i++) {
			const basePath = path.resolve(paths[i]);
			const p = path.resolve(paths[i], name);

console.log('node-loaders.js getSource()-1A  paths[i]:',paths[i]);
console.log('node-loaders.js getSource()-1B  basePath:',basePath);
console.log('node-loaders.js getSource()-1C  p:',p);

			// Only allow the current directory and anything
			// underneath it to be searched
			if (p.indexOf(basePath) === 0 && await fileExists(p)) {
				fullpath = p;
				break;
			}
		}

console.log('node-loaders.js getSource()-2  fullpath:',fullpath);
		if (!fullpath) 
			return null;
console.log('node-loaders.js getSource()-3');

		this.pathsToNames[fullpath] = name;

		const source = {
			src: await fs.readFile(fullpath, 'utf-8'),
			path: fullpath,
			noCache: this.noCache
		};
		this.emit('load', name, source);

console.log('node-loaders.js getSource()-4  source:',source);

		return source;
	}
}


export class NodeResolveLoader extends Loader 
{
	pathsToNames = {};
	noCache;
	watcher;

	constructor(opts) 
	{
		super();
		opts = opts || {};
		this.pathsToNames = {};
		this.noCache = !!opts.noCache;

		if (opts.watch) {
			try {
				chokidar = require('chokidar'); // eslint-disable-line global-require
			} catch (e) {
				throw new Error('watch requires chokidar to be installed');
			}
			this.watcher = chokidar.watch();

			this.watcher.on('change', function (fullname) {
				this.emit('update', this.pathsToNames[fullname], fullname);
			});
			this.watcher.on('error', error => {
				console.log('Watcher error: ' + error);
			});

			this.on('load', function (name, source) {
				this.watcher.add(source.path);
			});
		}
	}

	async getSource(name:string): Promise<LoaderSource>
	{
		// Don't allow file-system traversal
		if ((/^\.?\.?(\/|\\)/).test(name)) 
			return null;
		if ((/^[A-Z]:/).test(name)) 
			return null;

		let fullpath;

		try {
			fullpath = require.resolve(name);
		} catch (e) {
			return null;
		}

		this.pathsToNames[fullpath] = name;

		const source = {
			src: await fs.readFile(fullpath,'utf-8'),
			path: fullpath,
			noCache: this.noCache,
		};

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

