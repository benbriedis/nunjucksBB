//import nunjucks from 'nunjucksBB';
//import nunjucks from '../index.js';
import {Loader,LoaderSource} from '../src/loader.js';

export default class AsyncLoader extends Loader    //XXX ==> nunjucks.Loader & nunjucks.LoaderSource
{
	public es6Async:boolean = true;

//XXX MAKE THIS OPTIONAL OR eg implement nunjucks.ILoaderAsync or something

/*
    getSource(name:string,callback?:nunjucks.Callback<Error,nunjucks.LoaderSource>): nunjucks.LoaderSource
	{
        this.getSourceAsync(name)
            .then((result:nunjucks.LoaderSource) => callback(null,result))
            .catch(err => callback(err,null));

		return <any>null;
	}
*/	
    getSource(name:string,callback?:any)
	{
		return <any>null;
	}

//XXX JUST USE THIS:
    async getSourceAsync(name:string): Promise<LoaderSource>
	{
//	nunjucks.render(name,{});

//XXX maybe try a decending timer...	
		const promise:Promise<LoaderSource> = new Promise((resolve,reject) => {
			setTimeout(() => {
				const content = 'CONTENT FOR: '+name+'\n';
				resolve({src:content,path:name,noCache:false});
			},5);
		});
		return await promise;
	}
}
