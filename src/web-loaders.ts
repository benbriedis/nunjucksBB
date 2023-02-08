'use strict';

import Loader, {LoaderSource} from './loader';
export {PrecompiledLoader} from './precompiled-loader';

export class WebLoader extends Loader 
{
	baseURL;
	useCache;

	constructor(baseURL, opts=undefined) 
	{
		super();
		this.baseURL = baseURL || '.';
		opts = opts || {};

		// By default, the cache is turned off because there's no way
		// to "watch" templates over HTTP, so they are re-downloaded
		// and compiled each time. (Remember, PRECOMPILE YOUR
		// TEMPLATES in production!)
		this.useCache = !!opts.useCache;

		// We default `async` to false so that the simple synchronous
		// API can be used when you aren't doing anything async in
		// your templates (which is most of the time). This performs a
		// sync ajax request, but that's ok because it should *only*
		// happen in development. PRECOMPILE YOUR TEMPLATES.
		this.async = !!opts.async;
	}

	createPath(from:string,to:string):string 
	{
		throw new Error('relative templates not support in the browser yet');
	}

	async getSource(name): Promise<LoaderSource> 
	{
		var useCache = this.useCache;
		var result;
		try {
			const src = await this.fetch(this.baseURL + '/' + name);

			result = { src: src, path: name, noCache: !useCache };
			this.emit('load', name, result);
		}
		catch(err) {
			if (err.status === 404) 
				result = null;
			else 
				throw err.content;
		}
		return result;
	}

	fetch(url):Promise<any> 
	{
		// Only in the browser please
		if (typeof window === 'undefined') 
			throw new Error('WebLoader can only by used in a browser');

		return new Promise((resolve,reject) => {
			const ajax = new XMLHttpRequest();
			let loading = true;

			ajax.onreadystatechange = () => {
				if (ajax.readyState === 4 && loading) {
					loading = false;
					if (ajax.status === 0 || ajax.status === 200) {
						resolve(ajax.responseText);
					} else {
						reject({
							status: ajax.status,
							content: ajax.responseText
						});
					}
				}
			};

			url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' +
			(new Date().getTime());

			ajax.open('GET',url,true);
			ajax.send();
		});
	}
}

