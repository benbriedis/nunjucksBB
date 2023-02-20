import Loader, {LoaderSource} from './Loader';

export default class WebLoader extends Loader 
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
	}

	createPath(from:string,to:string):string 
	{
		throw new Error('relative templates not support in the browser yet');
	}

	async getSource(name): Promise<LoaderSource|null> 
	{
		const src = await this.fetch(this.baseURL + '/' + name);
		if (src==null)
			return null;

		const result = { src: src, path: name, noCache: !this.useCache };
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
					if (ajax.status === 0 || ajax.status === 200) 
						return resolve(ajax.responseText);
					if (ajax.status === 404) 
						return resolve(null);

					reject(new Error(`${ajax.responseText} (ajax returned code ${ajax.status})`));
				}
			};

			url += (url.indexOf('?') === -1 ? '?' : '&') + 's=' +
			(new Date().getTime());

			ajax.open('GET',url,true);
			ajax.send();
		});
	}
}

